import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('แดชบอร์ดการเงินประจำวัน', () => {
  beforeEach(() => localStorage.clear())

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
    expect(localStorage.getItem('daily-money-transactions-v1')).toContain('ค่าขนม')
  })

  it('โหลดเฉพาะรายการที่ถูกต้องจาก localStorage', () => {
    localStorage.setItem('daily-money-transactions-v1', JSON.stringify([
      { id: 10, title: 'งานเสริม', category: 'รายรับ', date: 'วันนี้', amount: 800, type: 'income', icon: '฿' },
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
    expect(localStorage.getItem('daily-money-transactions-v1')).not.toContain('กาแฟ')
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
    expect(localStorage.getItem('daily-money-transactions-v1')).toContain('กาแฟ')
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

  it('ใช้ System Theme เมื่อ Theme Preference ไม่ถูกต้อง', () => {
    localStorage.setItem('daily-money-theme-v1', 'broken')
    Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) })
    render(<App />)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
