;; StackPay Architecture
;; Compact MVP surface for:
;; - merchant-created invoices
;; - processor-gated payment settlement
;; - hosted invoice lookup by on-chain invoice id

(define-trait invoice-trait (
  (get-invoice
    ((string-ascii 85))
    (
      response
      (optional {
        merchant: principal,
        recipient: principal,
        amount: uint,
        currency: (string-ascii 10),
        status: uint,
        created-at: uint,
        expires-at: uint,
        paid-at: (optional uint),
        description: (string-utf8 256),
      })
      uint
    )
  )
))

(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVOICE_NOT_FOUND (err u101))
(define-constant ERR_INVALID_STATUS (err u102))
(define-constant ERR_INVOICE_ALREADY_PAID (err u103))
(define-constant ERR_INSUFFICIENT_PAYMENT (err u104))
(define-constant ERR_INVALID_AMOUNT (err u105))
(define-constant ERR_INVALID_INPUT (err u107))
(define-constant ERR_INVALID_PRINCIPAL (err u109))

(define-constant STATUS_PENDING u0)
(define-constant STATUS_PAID u1)
(define-constant STATUS_EXPIRED u2)

(define-constant CURRENCY_STX "STX")
(define-constant CURRENCY_SBTC "sBTC")
(define-constant CURRENCY_USDC "USDCx")

(define-data-var owner principal tx-sender)
(define-data-var processor (optional principal) none)
(define-data-var invoice-ctr uint u0)
(define-data-var receipt-ctr uint u0)
(define-data-var invoice-total uint u0)
(define-data-var receipt-total uint u0)

(define-map invoices
  { invoice-id: (string-ascii 85) }
  {
    merchant: principal,
    recipient: principal,
    amount: uint,
    currency: (string-ascii 10),
    status: uint,
    created-at: uint,
    expires-at: uint,
    paid-at: (optional uint),
    description: (string-utf8 256),
  }
)

(define-map receipts
  { receipt-id: (string-ascii 85) }
  {
    invoice-id: (string-ascii 85),
    payer: principal,
    amount-paid: uint,
    tx-id: (buff 32),
    timestamp: uint,
  }
)

(define-private (current-time)
  stacks-block-time
)

(define-private (valid-currency (currency (string-ascii 10)))
  (or
    (is-eq currency CURRENCY_STX)
    (or (is-eq currency CURRENCY_SBTC) (is-eq currency CURRENCY_USDC))
  )
)

(define-private (valid-principal (who principal))
  (and
    (not (is-eq who 'SP000000000000000000002Q6VF78))
    (not (is-eq who 'ST000000000000000000002AMW42H))
    true
  )
)

(define-private (new-invoice-id)
  (let (
      (counter (var-get invoice-ctr))
      (timestamp (current-time))
    )
    (var-set invoice-ctr (+ counter u1))
    (concat
      (concat "INV_" (int-to-ascii timestamp))
      (concat "_" (int-to-ascii counter))
    )
  )
)

(define-private (new-receipt-id)
  (let (
      (counter (var-get receipt-ctr))
      (timestamp (current-time))
    )
    (var-set receipt-ctr (+ counter u1))
    (concat
      (concat "RCP_" (int-to-ascii timestamp))
      (concat "_" (int-to-ascii counter))
    )
  )
)

(define-public (set-processor (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR_UNAUTHORIZED)
    (var-set processor (some who))
    (ok true)
  )
)

(define-public (create-invoice
    (recipient principal)
    (amount uint)
    (currency (string-ascii 10))
    (expires-in-seconds uint)
    (description (string-utf8 256))
  )
  (let (
      (invoice-id (new-invoice-id))
      (now (current-time))
    )
    (asserts! (valid-principal recipient) ERR_INVALID_PRINCIPAL)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (valid-currency currency) ERR_INVALID_INPUT)
    (asserts! (> expires-in-seconds u0) ERR_INVALID_INPUT)
    (map-set invoices { invoice-id: invoice-id } {
      merchant: tx-sender,
      recipient: recipient,
      amount: amount,
      currency: currency,
      status: STATUS_PENDING,
      created-at: now,
      expires-at: (+ now expires-in-seconds),
      paid-at: none,
      description: description,
    })
    (var-set invoice-total (+ (var-get invoice-total) u1))
    (print {
      event: "invoice-created",
      invoice-id: invoice-id,
      merchant: tx-sender,
      recipient: recipient,
      amount: amount,
      currency: currency,
    })
    (ok invoice-id)
  )
)

(define-public (process-payment
    (invoice-id (string-ascii 85))
    (payer principal)
    (amount uint)
    (txid (buff 32))
  )
  (let ((proc (unwrap! (var-get processor) ERR_UNAUTHORIZED)))
    (asserts! (is-eq contract-caller proc) ERR_UNAUTHORIZED)
    (let (
        (invoice (unwrap! (map-get? invoices { invoice-id: invoice-id }) ERR_INVOICE_NOT_FOUND))
        (now (current-time))
      )
      (asserts! (is-eq (get status invoice) STATUS_PENDING) ERR_INVOICE_ALREADY_PAID)
      (asserts! (is-eq amount (get amount invoice)) ERR_INSUFFICIENT_PAYMENT)
      (asserts! (< now (get expires-at invoice)) ERR_INVALID_STATUS)
      (map-set invoices { invoice-id: invoice-id }
        (merge invoice {
          status: STATUS_PAID,
          paid-at: (some now),
        })
      )
      (let ((receipt-id (new-receipt-id)))
        (map-set receipts { receipt-id: receipt-id } {
          invoice-id: invoice-id,
          payer: payer,
          amount-paid: amount,
          tx-id: txid,
          timestamp: now,
        })
        (var-set receipt-total (+ (var-get receipt-total) u1))
        (print {
          event: "invoice-paid",
          invoice-id: invoice-id,
          receipt-id: receipt-id,
          payer: payer,
          amount: amount,
        })
        (ok receipt-id)
      )
    )
  )
)

(define-public (expire-invoice (invoice-id (string-ascii 85)))
  (let ((invoice (unwrap! (map-get? invoices { invoice-id: invoice-id }) ERR_INVOICE_NOT_FOUND)))
    (asserts!
      (or
        (is-eq tx-sender (get merchant invoice))
        (is-eq tx-sender (var-get owner))
      )
      ERR_UNAUTHORIZED
    )
    (asserts! (is-eq (get status invoice) STATUS_PENDING) ERR_INVALID_STATUS)
    (asserts! (<= (get expires-at invoice) (current-time)) ERR_INVALID_STATUS)
    (map-set invoices { invoice-id: invoice-id }
      (merge invoice { status: STATUS_EXPIRED })
    )
    (ok true)
  )
)

(define-read-only (get-current-time)
  (ok (current-time))
)

(define-read-only (get-invoice (invoice-id (string-ascii 85)))
  (ok (map-get? invoices { invoice-id: invoice-id }))
)

(define-read-only (get-receipt (receipt-id (string-ascii 85)))
  (ok (map-get? receipts { receipt-id: receipt-id }))
)

(define-read-only (is-invoice-payable (invoice-id (string-ascii 85)))
  (match (map-get? invoices { invoice-id: invoice-id })
    invoice
      (and
        (is-eq (get status invoice) STATUS_PENDING)
        (< (current-time) (get expires-at invoice))
      )
    false
  )
)

(define-read-only (get-invoice-count)
  (ok (var-get invoice-total))
)

(define-read-only (get-receipt-count)
  (ok (var-get receipt-total))
)
