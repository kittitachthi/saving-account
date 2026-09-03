import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('แดชบอร์ดการเงินประจำวัน', () => {
  beforeEach(() => {
    localStorage.clear()
    const createdAt = new Date().toISOString()
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'เงินเดือน', category: 'รายรับ', date: 'วันนี้', createdAt, amount: 32500, type: 'income', icon: '฿' },
      { id: 2, title: 'ค่าอาหารกลางวัน', category: 'อาหาร', date: 'วันนี้', createdAt, amount: 85, type: 'expense', icon: '🍜' },
      { id: 3, title: 'กาแฟ', category: 'อาหาร', date: 'วันนี้', createdAt, amount: 65, type: 'expense', icon: '☕' },
      { id: 4, title: 'ค่าเดินทาง', category: 'เดินทาง', date: 'เมื่อวาน', createdAt: new Date(Date.now() - 86400000).toISOString(), amount: 120, type: 'expense', icon: '🚆' },
      { id: 5, title: 'ซื้อของเข้าบ้าน', category: 'ช้อปปิ้ง', date: 'เมื่อวาน', createdAt: new Date(Date.now() - 86400000).toISOString(), amount: 1240, type: 'expense', icon: '🛍️' },
    ]))
  })

  it('แสดงข้อมูลตัวอย่างและคำนวณยอดเริ่มต้น', () => {
    render(<App />)
    expect(screen.getByText('฿30,990', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('ค่าอาหารกลางวัน')).toBeInTheDocument()
  })

  it('เพิ่มรายจ่าย อัปเดตยอด และบันทึกลง localStorage', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /เพิ่มรายการ/ }))
    const form = screen.getByRole('form', { name: 'เพิ่มรายการใหม่' })
    await user.type(within(form).getByLabelText('ชื่อรายการ'), 'ค่าขนม')
    await user.type(within(form).getByLabelText('จำนวนเงิน (บาท)'), '100')
    await user.click(within(form).getByRole('button', { name: 'บันทึกรายการ' }))
    expect(screen.getByText('ค่าขนม')).toBeInTheDocument()
    expect(screen.getByText('฿30,890', { exact: false })).toBeInTheDocument()
    expect(localStorage.getItem('daily-money-transactions-v2')).toContain('ค่าขนม')
  })

  it('โหลดเฉพาะรายการที่ถูกต้องจาก localStorage', () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 10, title: 'งานเสริม', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 800, type: 'income', icon: '฿' },
      { id: 'เสีย', title: 'ข้อมูลเสีย', amount: 1, type: 'expense' },
    ]))
    render(<App />)
    expect(screen.getByText('งานเสริม')).toBeInTheDocument()
    expect(screen.queryByText('ข้อมูลเสีย')).not.toBeInTheDocument()
    expect(screen.getAllByText('฿800', { exact: false }).length).toBeGreaterThan(0)
  })

  it('กรองรายการรายรับและรายจ่ายจากหน้าจอ', async () => {
    const user = userEvent.setup()
    render(<App />)
    const filters = screen.getByRole('group', { name: 'กรองรายการ' })
    await user.click(within(filters).getByRole('button', { name: 'รายรับ' }))
    expect(screen.getByText('เงินเดือน')).toBeInTheDocument()
    expect(screen.queryByText('กาแฟ')).not.toBeInTheDocument()
    await user.click(within(filters).getByRole('button', { name: 'รายจ่าย' }))
    expect(screen.getByText('กาแฟ')).toBeInTheDocument()
    expect(screen.queryByText('เงินเดือน')).not.toBeInTheDocument()
  })

  it('เพิ่มเงินเก็บ แยกหมวด และลดยอดเงินพร้อมใช้', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /เพิ่มรายการ/ }))
    const form = screen.getByRole('form', { name: 'เพิ่มรายการใหม่' })
    await user.click(within(form).getByRole('button', { name: 'เงินเก็บ' }))
    await user.type(within(form).getByLabelText('ชื่อรายการ'), 'สำรองเดือนนี้')
    await user.type(within(form).getByLabelText('จำนวนเงิน (บาท)'), '5000')
    await user.selectOptions(within(form).getByLabelText('ประเภทเงินเก็บ'), 'ท่องเที่ยว')
    await user.click(within(form).getByRole('button', { name: 'บันทึกรายการ' }))
    expect(screen.getByText('สำรองเดือนนี้')).toBeInTheDocument()
    expect(screen.getByText('฿25,990', { exact: false })).toBeInTheDocument()
    expect(screen.getAllByText('฿5,000', { exact: false }).length).toBeGreaterThan(0)
  })

  it('ตั้งเป้าหมายและแสดงความคืบหน้าเงินเก็บ', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /ตั้งเป้าหมายเงินเก็บ/ }))
    const form = screen.getByRole('form', { name: 'ตั้งเป้าหมายเงินเก็บ' })
    await user.type(within(form).getByLabelText('เป้าหมาย (บาท)'), '20000')
    await user.click(within(form).getByRole('button', { name: 'บันทึกเป้าหมาย' }))
    expect(screen.getByText('เก็บแล้ว ฿0 จากเป้า ฿20,000')).toBeInTheDocument()
    expect(localStorage.getItem('daily-money-savings-goal-v1')).toBe('20000')
  })

  it('ปฏิเสธรายจ่ายที่มากกว่าเงินพร้อมใช้และแจ้งส่วนที่เกิน', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /เพิ่มรายการ/ }))
    const form = screen.getByRole('form', { name: 'เพิ่มรายการใหม่' })
    await user.type(within(form).getByLabelText('ชื่อรายการ'), 'รายการเกินยอด')
    await user.type(within(form).getByLabelText('จำนวนเงิน (บาท)'), '40000')
    await user.click(within(form).getByRole('button', { name: 'บันทึกรายการ' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('ยอดรายจ่ายมากกว่าเงินพร้อมใช้ 9,010 บาท')
    expect(screen.queryByText('รายการเกินยอด')).not.toBeInTheDocument()
  })

  it('ลบรายการและปรับยอดรวมกับ localStorage ให้สอดคล้องกัน', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'ลบรายการ กาแฟ' }))
    expect(screen.getAllByText('กาแฟ').length).toBeGreaterThan(1)
    const dialog = screen.getByRole('dialog', { name: 'ลบรายการนี้หรือไม่?' })
    expect(within(dialog).getByRole('button', { name: 'ยกเลิก' })).toHaveFocus()
    expect(within(dialog).getByText('−฿65.00')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'ลบรายการ' }))
    expect(screen.queryByText('กาแฟ')).not.toBeInTheDocument()
    expect(screen.getByText('฿31,055', { exact: false })).toBeInTheDocument()
    expect(localStorage.getItem('daily-money-transactions-v2')).not.toContain('กาแฟ')
  })

  it('ยกเลิก Delete Confirmation โดยไม่ลบ Transaction', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'ลบรายการ กาแฟ' }))
    await user.click(screen.getByRole('button', { name: 'ยกเลิก' }))
    expect(screen.getByText('กาแฟ')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Undo คืน Transaction และยอดรวมหลังการลบ', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'ลบรายการ กาแฟ' }))
    await user.click(screen.getByRole('button', { name: 'ลบรายการ' }))
    expect(screen.getByRole('status')).toHaveTextContent('ลบรายการแล้ว')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('กาแฟ')).toBeInTheDocument()
    expect(screen.getByText('฿30,990', { exact: false })).toBeInTheDocument()
    expect(localStorage.getItem('daily-money-transactions-v2')).toContain('กาแฟ')
  })

  it('แสดง Category Summary เมื่อ focus Donut Segment', async () => {
    const user = userEvent.setup()
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟสัดส่วนรายจ่าย' })
    const segment = within(chart).getByRole('button', { name: 'อาหาร 10%' })
    await user.tab()
    segment.focus()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('อาหาร')
    expect(tooltip).toHaveTextContent('ยอดรวม ฿150')
    expect(tooltip).toHaveTextContent('2 รายการ')
    expect(tooltip).toHaveTextContent('เฉลี่ย ฿75')
  })

  it('แสดงรายละเอียดหมวดเงินเก็บเมื่อ focus ส่วนกราฟ', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'ก้อนแรก', category: 'เงินฉุกเฉิน', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 3000, type: 'saving', icon: '◇' },
      { id: 2, title: 'ก้อนสอง', category: 'เงินฉุกเฉิน', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 1000, type: 'saving', icon: '◇' },
      { id: 3, title: 'เที่ยว', category: 'ท่องเที่ยว', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 1000, type: 'saving', icon: '◇' },
      { id: 4, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 10000, type: 'income', icon: '฿' },
    ]))
    localStorage.setItem('daily-money-savings-goal-v1', '8000')
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟความคืบหน้าเงินเก็บ' })
    within(chart).getByRole('button', { name: 'เงินฉุกเฉิน 80% ของเงินเก็บ' }).focus()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('ยอดรวม ฿4,000')
    expect(tooltip).toHaveTextContent('80% ของเงินเก็บทั้งหมด')
    expect(tooltip).toHaveTextContent('2 รายการ')
    expect(tooltip).toHaveTextContent('เฉลี่ย ฿2,000')
    expect(tooltip).toHaveTextContent('50% ของเป้าหมาย')
    expect(tooltip).toHaveTextContent('ยังขาด ฿3,000')
  })

  it('ชั้นข้อความกลางกราฟไม่ดัก pointer และ hover ส่วนสีเปิด tooltip', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'เก็บฉุกเฉิน', category: 'เงินฉุกเฉิน', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 2000, type: 'saving', icon: '◇' },
      { id: 2, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 5000, type: 'income', icon: '฿' },
    ]))
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByTestId('savings-chart-center')).toHaveStyle({ pointerEvents: 'none' })
    const chart = screen.getByRole('group', { name: 'กราฟความคืบหน้าเงินเก็บ' })
    await user.hover(within(chart).getByRole('button', { name: 'เงินฉุกเฉิน 100% ของเงินเก็บ' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('เงินฉุกเฉิน')
  })

  it('เปิด tooltip จาก legend และปิดด้วย Escape', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'เก็บเที่ยว', category: 'ท่องเที่ยว', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 5000, type: 'saving', icon: '◇' },
      { id: 2, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 10000, type: 'income', icon: '฿' },
    ]))
    const user = userEvent.setup()
    render(<App />)
    const legendButton = screen.getByRole('button', { name: /ท่องเที่ยว.*฿5,000/ })
    await user.click(legendButton)
    expect(screen.getByRole('tooltip')).toHaveTextContent('ยังไม่ได้ตั้งเป้าหมาย')
    legendButton.focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('Floating Tooltip ตาม pointer และหยุดตำแหน่งเมื่อ pin', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'เก็บเที่ยว', category: 'ท่องเที่ยว', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 2000, type: 'saving', icon: '◇' },
      { id: 2, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 5000, type: 'income', icon: '฿' },
    ]))
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟความคืบหน้าเงินเก็บ' })
    const segment = within(chart).getByRole('button', { name: 'ท่องเที่ยว 100% ของเงินเก็บ' })
    fireEvent.pointerEnter(segment, { clientX: 100, clientY: 120 })
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveStyle({ left: '112px', top: '132px' }))
    fireEvent.pointerMove(segment, { clientX: 150, clientY: 160 })
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveStyle({ left: '162px', top: '172px' }))
    fireEvent.click(segment, { clientX: 150, clientY: 160, detail: 1 })
    fireEvent.pointerMove(segment, { clientX: 220, clientY: 230 })
    expect(screen.getByRole('tooltip')).toHaveStyle({ left: '162px', top: '172px' })
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('กราฟรายจ่ายใช้ canonical pin interaction เดียวกัน', async () => {
    const user = userEvent.setup()
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟสัดส่วนรายจ่าย' })
    const segment = within(chart).getByRole('button', { name: 'อาหาร 10%' })
    await user.click(segment)
    expect(screen.getByRole('tooltip')).toHaveTextContent('อาหาร')
    await user.unhover(segment)
    expect(screen.getByRole('tooltip')).toHaveTextContent('อาหาร')
    await user.click(segment)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('Tooltip ที่ pin ไม่เปลี่ยนจาก hover และสลับเมื่อเลือกหมวดใหม่', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'ฉุกเฉิน', category: 'เงินฉุกเฉิน', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 2000, type: 'saving', icon: '◇' },
      { id: 2, title: 'เที่ยว', category: 'ท่องเที่ยว', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 1000, type: 'saving', icon: '◇' },
      { id: 3, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 5000, type: 'income', icon: '฿' },
    ]))
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟความคืบหน้าเงินเก็บ' })
    const emergency = within(chart).getByRole('button', { name: 'เงินฉุกเฉิน 67% ของเงินเก็บ' })
    const travel = within(chart).getByRole('button', { name: 'ท่องเที่ยว 33% ของเงินเก็บ' })
    fireEvent.click(emergency, { clientX: 100, clientY: 100, detail: 1 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('เงินฉุกเฉิน')
    fireEvent.pointerEnter(travel, { clientX: 200, clientY: 200 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('เงินฉุกเฉิน')
    fireEvent.click(travel, { clientX: 200, clientY: 200, detail: 1 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('ท่องเที่ยว')
  })

  it('touch และ keyboard ใช้ trigger เป็น fallback anchor', async () => {
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'เที่ยว', category: 'ท่องเที่ยว', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 1000, type: 'saving', icon: '◇' },
      { id: 2, title: 'รายรับ', category: 'รายรับ', date: 'วันนี้', createdAt: new Date().toISOString(), amount: 5000, type: 'income', icon: '฿' },
    ]))
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟความคืบหน้าเงินเก็บ' })
    const segment = within(chart).getByRole('button', { name: 'ท่องเที่ยว 100% ของเงินเก็บ' })
    Object.defineProperty(segment, 'getBoundingClientRect', { value: () => ({ left: 20, top: 30, width: 80, height: 40, right: 100, bottom: 70, x: 20, y: 30, toJSON: () => ({}) }) })
    fireEvent.pointerDown(segment, { pointerType: 'touch', clientX: 300, clientY: 300 })
    fireEvent.click(segment, { clientX: 300, clientY: 300, detail: 1 })
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveStyle({ left: '72px', top: '62px' }))
    fireEvent.pointerDown(document.body)
    segment.focus()
    fireEvent.keyDown(segment, { key: 'Enter' })
    expect(screen.getByRole('tooltip')).toHaveTextContent('ท่องเที่ยว')
    fireEvent.keyDown(segment, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.keyDown(segment, { key: ' ' })
    expect(screen.getByRole('tooltip')).toHaveTextContent('ท่องเที่ยว')
    fireEvent.keyDown(segment, { key: ' ' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('ยังโต้ตอบกับกราฟได้เมื่อผู้ใช้ลดการเคลื่อนไหว', async () => {
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => true }) })
    const user = userEvent.setup()
    render(<App />)
    const chart = screen.getByRole('group', { name: 'กราฟสัดส่วนรายจ่าย' })
    const segment = within(chart).getByRole('button', { name: 'อาหาร 10%' })
    await user.hover(segment)
    expect(screen.getByRole('tooltip')).toHaveTextContent('อาหาร')
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia })
  })

  it('hover legend เปิด Tooltip ของหมวดเดียวกัน', async () => {
    const user = userEvent.setup()
    render(<App />)
    const legend = screen.getAllByRole('button', { name: /อาหาร.*10%/ }).find((item) => item.tagName === 'BUTTON')!
    await user.hover(legend)
    expect(screen.getByRole('tooltip')).toHaveTextContent('อาหาร')
    await user.unhover(legend)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('ใช้ Theme Preference เหนือ System Theme และเปลี่ยนผ่านการตั้งค่า', async () => {
    localStorage.setItem('daily-money-theme-v1', 'dark')
    const user = userEvent.setup()
    render(<App />)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    await user.click(screen.getByRole('button', { name: '⚙ ตั้งค่า' }))
    const settings = screen.getByRole('region', { name: 'การตั้งค่า' })
    const toggle = within(settings).getByRole('button', { name: 'เปลี่ยนเป็นธีมสว่าง' })
    expect(toggle).toHaveAttribute('title', 'เปลี่ยนเป็นธีมสว่าง')
    await user.click(toggle)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('daily-money-theme-v1')).toBe('light')
  })

  it('ซิงก์ Theme Preference จากแท็บอื่นทันที', async () => {
    render(<App />)
    window.dispatchEvent(new StorageEvent('storage', { key: 'daily-money-theme-v1', newValue: 'dark' }))
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'))
  })

  it('เริ่มด้วยรายการว่างและไม่แสดง Pagination', () => {
    localStorage.clear()
    render(<App />)
    expect(screen.getByText('ยังไม่มีรายการธุรกรรม')).toBeInTheDocument()
    expect(screen.getByText('ยังไม่มีรายการวันนี้')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'หน้ารายการธุรกรรม' })).not.toBeInTheDocument()
  })

  it('แสดงรายรับเทียบรายจ่ายวันนี้และรายละเอียดรายการสูงสุดร่วมกัน', async () => {
    const createdAt = new Date().toISOString()
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([
      { id: 1, title: 'งานหนึ่ง', category: 'รายรับ', date: '', createdAt, amount: 1500, type: 'income', icon: '฿' },
      { id: 2, title: 'งานสอง', category: 'รายรับ', date: '', createdAt, amount: 1500, type: 'income', icon: '฿' },
      { id: 3, title: 'อาหาร', category: 'อาหาร', date: '', createdAt, amount: 1000, type: 'expense', icon: '•' },
      { id: 4, title: 'เงินเก็บ', category: 'ฉุกเฉิน', date: '', createdAt, amount: 5000, type: 'saving', icon: '◇' },
    ]))
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByLabelText('รายรับ 75% รายจ่าย 25%')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /รายรับ ฿3,000/ }))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('2 รายการ')
    expect(tooltip).toHaveTextContent('งานหนึ่ง')
    expect(tooltip).toHaveTextContent('งานสอง')
  })

  it('คงสีเขียวเมื่อมีเฉพาะรายรับ 100%', () => {
    const createdAt = new Date().toISOString()
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([{ id: 1, title: 'รายรับ', category: 'รายรับ', date: '', createdAt, amount: 1000, type: 'income', icon: '฿' }]))
    render(<App />)
    expect(screen.getByRole('button', { name: 'รายรับ 100%' })).toHaveClass(/incomeBar/)
    expect(screen.queryByRole('button', { name: 'รายจ่าย 0%' })).not.toBeInTheDocument()
  })

  it('คงสีแดงเมื่อมีเฉพาะรายจ่าย 100%', () => {
    const createdAt = new Date().toISOString()
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify([{ id: 1, title: 'รายจ่าย', category: 'อาหาร', date: '', createdAt, amount: 1000, type: 'expense', icon: '•' }]))
    render(<App />)
    expect(screen.getByRole('button', { name: 'รายจ่าย 100%' })).toHaveClass(/expenseBar/)
    expect(screen.queryByRole('button', { name: 'รายรับ 0%' })).not.toBeInTheDocument()
  })

  it('แบ่งหน้าหลังกรองและกลับหน้าแรกเมื่อเปลี่ยนตัวกรอง', async () => {
    const createdAt = new Date().toISOString()
    localStorage.setItem('daily-money-transactions-v2', JSON.stringify(Array.from({ length: 11 }, (_, index) => ({ id: index + 1, title: `รายรับ ${index + 1}`, category: 'รายรับ', date: '', createdAt, amount: 1, type: 'income', icon: '฿' }))))
    const user = userEvent.setup()
    render(<App />)
    const pagination = screen.getByRole('navigation', { name: 'หน้ารายการธุรกรรม' })
    await user.click(within(pagination).getByRole('button', { name: '2' }))
    expect(within(pagination).getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    const filters = screen.getByRole('group', { name: 'กรองรายการ' })
    await user.click(within(filters).getByRole('button', { name: 'รายรับ' }))
    expect(within(pagination).getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
  })

  it('ใช้ System Theme เมื่อ Theme Preference ไม่ถูกต้อง', () => {
    localStorage.setItem('daily-money-theme-v1', 'broken')
    Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) })
    render(<App />)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})

