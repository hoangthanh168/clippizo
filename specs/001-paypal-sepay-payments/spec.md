# Feature Specification: PayPal and SePay One-Time Subscription Payments

**Feature Branch**: **Created**: 2026-01-04
**Status**: Draft
**Input**: User description: Thay Stripe bang PayPal va SePay cho thanh toan subscription one-time voi manual renewal

## User Scenarios and Testing *(mandatory)*

### User Story 1 - Purchase Subscription via SePay (Priority: P1)

Nguoi dung Viet Nam muon mua goi subscription bang chuyen khoan ngan hang hoac the noi dia thong qua SePay gateway.

**Why this priority**: Day la use case chinh cho thi truong Viet Nam - target market chinh cua san pham.

**Independent Test**: Co the test hoan chinh bang cach tao don hang, redirect sang SePay sandbox, hoan tat thanh toan va verify subscription duoc kich hoat.

**Acceptance Scenarios**:

1. **Given** user da dang nhap va dang o trang pricing, **When** user chon goi Pro va click Thanh toan qua SePay, **Then** user duoc redirect den SePay payment page.

2. **Given** user da hoan tat thanh toan tren SePay, **When** SePay gui IPN callback voi status APPROVED, **Then** subscription duoc kich hoat voi ngay het han = ngay hien tai + 30 ngay.

3. **Given** user huy thanh toan tren SePay, **When** user bi redirect ve cancel_url, **Then** don hang duoc danh dau cancelled.

---

### User Story 2 - Purchase Subscription via PayPal (Priority: P1)

Nguoi dung quoc te muon mua goi subscription bang PayPal hoac the quoc te.

**Why this priority**: PayPal la phuong thuc thanh toan pho bien nhat cho khach hang quoc te.

**Independent Test**: Co the test hoan chinh bang cach tao PayPal order, redirect sang PayPal checkout, capture payment va verify subscription duoc kich hoat.

**Acceptance Scenarios**:

1. **Given** user da dang nhap va dang o trang pricing, **When** user chon goi Pro va click Pay with PayPal, **Then** system tao PayPal order va redirect user den PayPal checkout page.

2. **Given** user da approve payment tren PayPal, **When** PayPal redirect ve return_url, **Then** system capture payment va kich hoat subscription.

3. **Given** user cancel payment tren PayPal, **When** PayPal redirect ve cancel_url, **Then** order duoc danh dau cancelled.

---

### User Story 3 - Manual Subscription Renewal (Priority: P2)

Nguoi dung co subscription sap het han hoac da het han muon gia han thu cong.

**Why this priority**: Day la core flow de duy tri revenue. User can chu dong gia han.

**Independent Test**: Co the test bang cach tao user voi subscription sap het han, user click renew, hoan tat thanh toan va verify expiry date duoc extend.

**Acceptance Scenarios**:

1. **Given** user co subscription het han trong 7 ngay, **When** user dang nhap, **Then** user thay banner thong bao subscription sap het han kem nut Gia han ngay.

2. **Given** user co subscription da het han, **When** user truy cap app, **Then** user bi gioi han features va thay prompt gia han subscription.

3. **Given** user click Gia han, **When** user hoan tat thanh toan, **Then** subscription expiry duoc extend them 30 ngay tu ngay het han hien tai (giu lai ngay con lai neu gia han som).

---

### User Story 4 - View Subscription Status (Priority: P2)

Nguoi dung muon xem trang thai subscription va lich su thanh toan cua minh.

**Why this priority**: Giup user quan ly subscription va plan cho viec gia han.

**Independent Test**: Co the test bang cach tao user voi subscription va payment history, navigate den settings/billing va verify thong tin hien thi dung.

**Acceptance Scenarios**:

1. **Given** user co active subscription, **When** user vao trang Account/Billing, **Then** user thay goi hien tai, ngay het han, va so ngay con lai.

2. **Given** user da co lich su thanh toan, **When** user vao trang Billing History, **Then** user thay danh sach cac giao dich.

---

### User Story 5 - Expiry Notification (Priority: P3)

He thong gui email nhac nho nguoi dung khi subscription sap het han.

**Why this priority**: Tang retention rate bang cach nhac user gia han truoc khi mat quyen truy cap.

**Independent Test**: Co the test bang scheduled job simulation, verify email duoc gui dung thoi diem.

**Acceptance Scenarios**:

1. **Given** user co subscription het han trong 7 ngay, **When** scheduled job chay, **Then** user nhan email nhac nho voi link gia han.

2. **Given** user co subscription het han trong 1 ngay, **When** scheduled job chay, **Then** user nhan email urgent reminder.

3. **Given** user da gia han subscription, **When** scheduled job chay, **Then** user KHONG nhan email nhac nho.

---

### Edge Cases

- User thanh toan thanh cong nhung webhook/IPN fail: System phai co co che retry va reconciliation
- User thanh toan 2 lan cho cung 1 order: Chi xu ly lan dau, cac lan sau ignore (idempotency)
- User co subscription active nhung muon upgrade: Extend tu expiry date hien tai
- Payment gateway timeout: User co the retry, order pending duoc cleanup sau 24h

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ho tro thanh toan qua SePay gateway voi cac phuong thuc: CARD, BANK_TRANSFER, NAPAS_BANK_TRANSFER
- **FR-002**: System MUST ho tro thanh toan qua PayPal voi phuong thuc one-time capture payment
- **FR-003**: System MUST luu tru subscription voi expiry date thay vi recurring billing
- **FR-004**: System MUST xu ly IPN/webhook tu ca SePay va PayPal de cap nhat subscription status
- **FR-005**: System MUST verify signature cua webhook/IPN de dam bao authenticity
- **FR-006**: System MUST cho phep user gia han subscription truoc hoac sau khi het han
- **FR-007**: System MUST hien thi subscription status va expiry date cho user
- **FR-008**: System MUST luu lich su thanh toan (payment history) cho moi user
- **FR-009**: System MUST gui email notification khi subscription sap het han (7 ngay va 1 ngay truoc)
- **FR-010**: System MUST xu ly duplicate webhook/IPN mot cach idempotent
- **FR-011**: System MUST ho tro sandbox/test mode cho ca SePay va PayPal
- **FR-012**: System MUST gioi han features khi subscription het han: Read-only mode (view existing data, cannot create new content)

### Key Entities

- **Profile**: User profile voi subscription info (plan, subscriptionStatus, subscriptionExpiresAt)
- **Payment**: Lich su thanh toan (paymentId, profileId, amount, currency, provider, providerTransactionId, status, createdAt)
- **SubscriptionPlan**: 3 tiers - Free (limited features, no payment required), Pro (full features), Enterprise (full features + priority support). Pricing details defined in planning phase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User co the hoan tat thanh toan subscription trong vong 3 phut tu khi click mua
- **SC-002**: 99% webhook/IPN duoc xu ly thanh cong trong lan dau tien
- **SC-003**: Subscription duoc kich hoat trong vong 30 giay sau khi thanh toan thanh cong
- **SC-004**: 100% duplicate webhooks duoc xu ly idempotent
- **SC-005**: Email nhac nho gia han duoc gui dung schedule voi ty le delivery > 95%
- **SC-006**: User co the xem subscription status va payment history trong vong 2 giay load time
- **SC-007**: Ty le payment failure do technical issues < 1%

## Clarifications

### Session 2026-01-04

- Q: How many subscription plans? → A: Three plans: Free + Pro + Enterprise
- Q: What features are restricted when expired/Free? → A: Read-only mode (can view existing data, cannot create new)
- Q: How is renewal expiry calculated? → A: From current expiry date (new_expiry = old_expiry + 30 days, keeps remaining days)

## Assumptions

- SePay merchant account da duoc setup va co credentials (MERCHANT_ID, SECRET_KEY)
- PayPal business account da duoc setup voi REST API credentials (CLIENT_ID, CLIENT_SECRET)
- Email service (Resend) da duoc configure de gui transactional emails
- Subscription plans duoc hardcode hoac config trong codebase
- Currency: VND cho SePay, USD cho PayPal
- Minimum subscription duration: 30 ngay
- Grace period sau khi het han: 0 ngay
