import type { Express, RequestHandler } from "express";
import { z } from "zod";
import type { AuthService } from "../auth/auth.service.js";
import { readSessionToken } from "../auth/auth.routes.js";
import { requireSameOriginMutation } from "../auth/csrf.js";
import { privacyNotice } from "../privacy/privacy-notice.js";
import {
  WalletAccessError,
  type WalletRepository,
} from "./wallet.repository.js";

const moneyAmountSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
const transactionOccurredOnSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01"
    );
  });
const transactionCreateInputSchema = z
  .object({
    operationId: z.uuid(),
    title: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(80),
    type: z.enum(["income", "expense", "saving"]),
    amount: moneyAmountSchema,
    occurredOn: transactionOccurredOnSchema,
    occurredTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  })
  .strict();

export function walletRoutesRegister(
  app: Express,
  auth: AuthService,
  repository: WalletRepository,
  appOrigin: string,
  notice = privacyNotice,
  now = () => new Date(),
) {
  const mutationCsrfGuard = requireSameOriginMutation(appOrigin);
  const authenticatedRequestGuard: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    response.setHeader("Cache-Control", "no-store");
    const token = readSessionToken(request);
    const session = token ? await auth.authenticate(token) : null;
    if (!session) {
      response.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Sign in required" },
      });
      return;
    }
    response.locals.userId = session.user.id;
    next();
  };
  app.use(["/api/privacy", "/api/wallets"], authenticatedRequestGuard);
  app.get("/api/privacy", async (_request, response) => {
    response.json({
      ...notice,
      accepted: await repository.privacyAcceptanceCheck(response.locals.userId),
    });
  });
  app.post(
    "/api/privacy/accept",
    mutationCsrfGuard,
    async (request, response) => {
      if (
        !z
          .object({ version: z.literal(notice.version) })
          .strict()
          .safeParse(request.body).success
      ) {
        response.status(409).json({
          error: { code: "NOTICE_CHANGED", message: "Read the current notice" },
        });
        return;
      }
      await repository.privacyAcceptanceRecord(response.locals.userId);
      response.status(204).end();
    },
  );
  const walletIdValidate: RequestHandler = (request, response, next) => {
    if (!z.uuid().safeParse(request.params.walletId).success) {
      response
        .status(400)
        .json({ error: { code: "BAD_REQUEST", message: "Invalid wallet" } });
      return;
    }
    next();
  };
  app.get(
    "/api/wallets/:walletId",
    walletIdValidate,
    async (request, response) => {
      const query = z
        .object({
          filter: z.enum(["all", "income", "expense", "saving"]).default("all"),
          page: z.coerce.number().int().min(1).max(1000000).default(1),
        })
        .strict()
        .safeParse(request.query);
      if (!query.success) {
        response
          .status(400)
          .json({ error: { code: "BAD_REQUEST", message: "Invalid query" } });
        return;
      }
      response.json(
        await repository.walletSnapshotRead(
          response.locals.userId,
          String(request.params.walletId),
          query.data.filter,
          query.data.page,
          now(),
        ),
      );
    },
  );
  app.post(
    "/api/wallets/:walletId/transactions",
    mutationCsrfGuard,
    walletIdValidate,
    async (request, response) => {
      const parsed = transactionCreateInputSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid transaction" },
        });
        return;
      }
      response
        .status(201)
        .json(
          await repository.walletTransactionCreate(
            response.locals.userId,
            String(request.params.walletId),
            parsed.data,
          ),
        );
    },
  );
  const transactionIdValidate: RequestHandler = (request, response, next) => {
    if (!z.uuid().safeParse(request.params.transactionId).success) {
      response.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid transaction request",
        },
      });
      return;
    }
    next();
  };
  const transactionUpdateInputSchema = transactionCreateInputSchema
    .omit({ operationId: true, type: true })
    .extend({ expectedUpdatedAt: z.iso.datetime() })
    .strict();
  const transactionDeleteInputSchema = z
    .object({ operationId: z.uuid(), expectedUpdatedAt: z.iso.datetime() })
    .strict();
  const transactionPath = "/api/wallets/:walletId/transactions/:transactionId";
  app.patch(
    transactionPath,
    mutationCsrfGuard,
    walletIdValidate,
    transactionIdValidate,
    async (request, response) => {
      const parsed = transactionUpdateInputSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid transaction request",
          },
        });
        return;
      }
      response.json(
        await repository.walletTransactionUpdate(
          response.locals.userId,
          String(request.params.walletId),
          String(request.params.transactionId),
          parsed.data,
          now,
        ),
      );
    },
  );
  app.delete(
    transactionPath,
    mutationCsrfGuard,
    walletIdValidate,
    transactionIdValidate,
    async (request, response) => {
      const parsed = transactionDeleteInputSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid transaction request",
          },
        });
        return;
      }
      response.json(
        await repository.walletTransactionDelete(
          response.locals.userId,
          String(request.params.walletId),
          String(request.params.transactionId),
          parsed.data,
          now,
        ),
      );
    },
  );
  app.post(
    `${transactionPath}/restore`,
    mutationCsrfGuard,
    walletIdValidate,
    transactionIdValidate,
    async (request, response) => {
      const parsed = z
        .object({ operationId: z.uuid() })
        .strict()
        .safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid transaction request",
          },
        });
        return;
      }
      await repository.walletTransactionRestore(
        response.locals.userId,
        String(request.params.walletId),
        String(request.params.transactionId),
        parsed.data.operationId,
        now,
      );
      response.status(204).end();
    },
  );
  app.put(
    "/api/wallets/:walletId/savings-goal",
    mutationCsrfGuard,
    walletIdValidate,
    async (request, response) => {
      const parsed = z
        .object({ amount: moneyAmountSchema })
        .strict()
        .safeParse(request.body);
      if (!parsed.success) {
        response
          .status(400)
          .json({ error: { code: "BAD_REQUEST", message: "Invalid goal" } });
        return;
      }
      await repository.savingsGoalUpdate(
        response.locals.userId,
        String(request.params.walletId),
        parsed.data.amount,
      );
      response.status(204).end();
    },
  );
  app.use(((error, _request, response, next) => {
    if (!(error instanceof WalletAccessError)) {
      next(error);
      return;
    }
    const status =
      error.code === "PRIVACY_REQUIRED" || error.code === "WALLET_FORBIDDEN"
        ? 403
        : 409;
    response
      .status(status)
      .json({ error: { code: error.code, message: error.code } });
  }) as import("express").ErrorRequestHandler);
}
