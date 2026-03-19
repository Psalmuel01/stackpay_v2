;; StackPay Architecture
;; - Time-based invoices and receipts using stacks-block-time
;; - Merchant public profiles and payment-link primitives
;; - Subscription plans/subscribers and settlement policy records
;; - Processor-gated payment finalization for indexers and hosted surfaces

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
        metadata: (string-utf8 256),
        email: (string-utf8 256),
        payment-address: (optional principal),
        webhook-url: (optional (string-ascii 256)),
      })
      uint
    )
  )
))

;; errors and constants
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVOICE_NOT_FOUND (err u101))
(define-constant ERR_INVALID_STATUS (err u102))
(define-constant ERR_INVOICE_ALREADY_PAID (err u103))
(define-constant ERR_INSUFFICIENT_PAYMENT (err u104))
(define-constant ERR_INVALID_AMOUNT (err u105))
(define-constant ERR_INVALID_INPUT (err u107))
(define-constant ERR_INVALID_WEBHOOK (err u108))
(define-constant ERR_INVALID_PRINCIPAL (err u109))
(define-constant ERR_DUPLICATE_SLUG (err u110))
(define-constant ERR_LINK_NOT_FOUND (err u111))
(define-constant ERR_PLAN_NOT_FOUND (err u112))
(define-constant ERR_SUBSCRIPTION_NOT_FOUND (err u113))
(define-constant ERR_POLICY_NOT_FOUND (err u114))
(define-constant ERR_INVALID_TIME (err u115))

(define-constant STATUS_PENDING u0)
(define-constant STATUS_PAID u1)
(define-constant STATUS_EXPIRED u2)

(define-constant PLAN_STATUS_ACTIVE u1)
(define-constant PLAN_STATUS_ARCHIVED u2)

(define-constant SUBSCRIPTION_STATUS_ACTIVE u1)
(define-constant SUBSCRIPTION_STATUS_PAUSED u2)
(define-constant SUBSCRIPTION_STATUS_CANCELED u3)

(define-constant SETTLEMENT_TRIGGER_THRESHOLD u0)
(define-constant SETTLEMENT_TRIGGER_SCHEDULED u1)

(define-constant LINK_KIND_INVOICE "invoice")
(define-constant LINK_KIND_MULTIPAY "multipay")
(define-constant LINK_KIND_SUBSCRIPTION "subscription")

(define-constant CURRENCY_STX "STX")
(define-constant CURRENCY_SBTC "sBTC")
(define-constant CURRENCY_USDC "USDCx")

;; data-vars
(define-data-var owner principal tx-sender)
(define-data-var processor (optional principal) none)
(define-data-var invoice-ctr uint u0)
(define-data-var receipt-ctr uint u0)
(define-data-var payment-link-ctr uint u0)
(define-data-var subscription-plan-ctr uint u0)
(define-data-var subscription-ctr uint u0)
(define-data-var settlement-policy-ctr uint u0)
(define-data-var invoice-total uint u0)
(define-data-var receipt-total uint u0)
(define-data-var payment-link-total uint u0)
(define-data-var subscription-plan-total uint u0)
(define-data-var subscription-total uint u0)
(define-data-var settlement-policy-total uint u0)

;; index maps
(define-map invoice-index
  { index: uint }
  { invoice-id: (string-ascii 85) }
)

(define-map receipt-index
  { index: uint }
  { receipt-id: (string-ascii 85) }
)

(define-map payment-link-index
  { index: uint }
  { link-id: (string-ascii 85) }
)

(define-map merchant-universal-link
  { merchant: principal }
  { link-id: (string-ascii 85) }
)

(define-map subscription-plan-index
  { index: uint }
  { plan-id: (string-ascii 85) }
)

(define-map subscription-index
  { index: uint }
  { subscription-id: (string-ascii 85) }
)

(define-map settlement-policy-index
  { index: uint }
  { policy-id: (string-ascii 85) }
)

;; core merchant and invoice maps
(define-map merchants
  { merchant: principal }
  {
    is-active: bool,
    webhook-url: (optional (string-ascii 256)),
    fee-recipient: (optional principal),
    created-at: uint,
  }
)

(define-map merchant-profiles
  { merchant: principal }
  {
    slug: (optional (string-ascii 64)),
    display-name: (string-utf8 64),
    settlement-wallet: (optional principal),
    default-currency: (string-ascii 10),
    updated-at: uint,
  }
)

(define-map merchant-slugs
  { slug: (string-ascii 64) }
  { merchant: principal }
)

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
    metadata: (string-utf8 256),
    email: (string-utf8 256),
    payment-address: (optional principal),
    webhook-url: (optional (string-ascii 256)),
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

;; payment-link and recurring primitives
(define-map payment-links
  { link-id: (string-ascii 85) }
  {
    merchant: principal,
    slug: (string-ascii 64),
    kind: (string-ascii 16),
    invoice-id: (optional (string-ascii 85)),
    plan-id: (optional (string-ascii 85)),
    title: (string-utf8 128),
    description: (string-utf8 256),
    default-currency: (optional (string-ascii 10)),
    default-amount: (optional uint),
    amount-step: (optional uint),
    allow-custom-amount: bool,
    accepts-stx: bool,
    accepts-sbtc: bool,
    accepts-usdcx: bool,
    is-universal: bool,
    is-active: bool,
    created-at: uint,
    updated-at: uint,
  }
)

(define-map payment-link-slugs
  { slug: (string-ascii 64) }
  { link-id: (string-ascii 85) }
)

(define-map subscription-plans
  { plan-id: (string-ascii 85) }
  {
    merchant: principal,
    name: (string-utf8 128),
    amount: uint,
    currency: (string-ascii 10),
    interval-seconds: uint,
    status: uint,
    created-at: uint,
    metadata: (string-utf8 256),
  }
)

(define-map subscriptions
  { subscription-id: (string-ascii 85) }
  {
    plan-id: (string-ascii 85),
    merchant: principal,
    subscriber: principal,
    status: uint,
    next-billing-at: uint,
    last-invoice-id: (optional (string-ascii 85)),
    created-at: uint,
  }
)

(define-map settlement-policies
  { policy-id: (string-ascii 85) }
  {
    merchant: principal,
    destination: principal,
    currency: (string-ascii 10),
    trigger-kind: uint,
    threshold: (optional uint),
    cadence-seconds: (optional uint),
    next-settlement-at: (optional uint),
    min-payout: uint,
    active: bool,
    created-at: uint,
  }
)

;; private helpers
(define-private (current-time)
  stacks-block-time
)

(define-private (valid-principal (p principal))
  (and
    (not (is-eq p 'SP000000000000000000002Q6VF78))
    (not (is-eq p 'ST000000000000000000002AMW42H))
    true
  )
)

(define-private (valid-currency (currency (string-ascii 10)))
  (or
    (is-eq currency CURRENCY_STX)
    (or (is-eq currency CURRENCY_SBTC) (is-eq currency CURRENCY_USDC))
  )
)

(define-private (valid-link-kind (kind (string-ascii 16)))
  (or
    (is-eq kind LINK_KIND_INVOICE)
    (or
      (is-eq kind LINK_KIND_MULTIPAY)
      (is-eq kind LINK_KIND_SUBSCRIPTION)
    )
  )
)

(define-private (accepted-currency-count
    (accepts-stx bool)
    (accepts-sbtc bool)
    (accepts-usdcx bool)
  )
  (+ (if accepts-stx u1 u0)
    (+ (if accepts-sbtc u1 u0) (if accepts-usdcx u1 u0))
  )
)

(define-private (currency-enabled
    (currency (string-ascii 10))
    (accepts-stx bool)
    (accepts-sbtc bool)
    (accepts-usdcx bool)
  )
  (if (is-eq currency CURRENCY_STX)
    accepts-stx
    (if (is-eq currency CURRENCY_SBTC)
      accepts-sbtc
      (if (is-eq currency CURRENCY_USDC) accepts-usdcx false)
    )
  )
)

(define-private (new-invoice-id)
  (let (
      (c (var-get invoice-ctr))
      (ts (current-time))
    )
    (var-set invoice-ctr (+ c u1))
    (concat (concat "INV_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (new-receipt-id)
  (let (
      (c (var-get receipt-ctr))
      (ts (current-time))
    )
    (var-set receipt-ctr (+ c u1))
    (concat (concat "RCP_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (new-payment-link-id)
  (let (
      (c (var-get payment-link-ctr))
      (ts (current-time))
    )
    (var-set payment-link-ctr (+ c u1))
    (concat (concat "LNK_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (new-plan-id)
  (let (
      (c (var-get subscription-plan-ctr))
      (ts (current-time))
    )
    (var-set subscription-plan-ctr (+ c u1))
    (concat (concat "PLN_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (new-subscription-id)
  (let (
      (c (var-get subscription-ctr))
      (ts (current-time))
    )
    (var-set subscription-ctr (+ c u1))
    (concat (concat "SUB_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (new-policy-id)
  (let (
      (c (var-get settlement-policy-ctr))
      (ts (current-time))
    )
    (var-set settlement-policy-ctr (+ c u1))
    (concat (concat "POL_" (int-to-ascii ts))
      (concat "_" (int-to-ascii c))
    )
  )
)

(define-private (persist-payment-link
    (link-id (string-ascii 85))
    (slug (string-ascii 64))
    (kind (string-ascii 16))
    (invoice-id (optional (string-ascii 85)))
    (plan-id (optional (string-ascii 85)))
    (title (string-utf8 128))
    (description (string-utf8 256))
    (default-currency (optional (string-ascii 10)))
    (default-amount (optional uint))
    (amount-step (optional uint))
    (allow-custom-amount bool)
    (accepts-stx bool)
    (accepts-sbtc bool)
    (accepts-usdcx bool)
    (is-universal bool)
    (is-active bool)
    (timestamp uint)
  )
  (map-set payment-links { link-id: link-id } {
    merchant: tx-sender,
    slug: slug,
    kind: kind,
    invoice-id: invoice-id,
    plan-id: plan-id,
    title: title,
    description: description,
    default-currency: default-currency,
    default-amount: default-amount,
    amount-step: amount-step,
    allow-custom-amount: allow-custom-amount,
    accepts-stx: accepts-stx,
    accepts-sbtc: accepts-sbtc,
    accepts-usdcx: accepts-usdcx,
    is-universal: is-universal,
    is-active: is-active,
    created-at: timestamp,
    updated-at: timestamp,
  })
)

;; public functions
(define-public (set-platform-fee-recipient (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR_UNAUTHORIZED)
    (map-set merchants
      { merchant: who }
      (merge
        (default-to {
          is-active: true,
          webhook-url: none,
          fee-recipient: none,
          created-at: (current-time),
        } (map-get? merchants { merchant: who }))
        { fee-recipient: (some who) }
      )
    )
    (ok true)
  )
)

(define-public (set-processor (p principal))
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR_UNAUTHORIZED)
    (var-set processor (some p))
    (ok true)
  )
)

(define-public (register-merchant (webhook (optional (string-ascii 256))))
  (begin
    (match webhook
      w (asserts! (is-eq (slice? w u0 u5) (some "https")) ERR_INVALID_WEBHOOK)
      true
    )
    (map-set merchants { merchant: tx-sender } {
      is-active: true,
      webhook-url: webhook,
      fee-recipient: none,
      created-at: (current-time),
    })
    (ok tx-sender)
  )
)

(define-public (configure-merchant-profile
    (slug (optional (string-ascii 64)))
    (display-name (string-utf8 64))
    (settlement-wallet (optional principal))
    (default-currency (string-ascii 10))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (existing (map-get? merchant-profiles { merchant: tx-sender }))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (valid-currency default-currency) ERR_INVALID_INPUT)
    (match settlement-wallet
      wallet (asserts! (valid-principal wallet) ERR_INVALID_PRINCIPAL)
      true
    )
    (match slug
      new-slug
        (begin
          (match (map-get? merchant-slugs { slug: new-slug })
            slug-owner (asserts! (is-eq (get merchant slug-owner) tx-sender) ERR_DUPLICATE_SLUG)
            true
          )
          (match existing
            profile
              (match (get slug profile)
                old-slug
                  (if (not (is-eq old-slug new-slug))
                    (begin (map-delete merchant-slugs { slug: old-slug }) true)
                    true
                  )
                true
              )
            true
          )
          (map-set merchant-slugs { slug: new-slug } { merchant: tx-sender })
        )
      (match existing
        profile
          (match (get slug profile)
            old-slug (begin (map-delete merchant-slugs { slug: old-slug }) true)
            true
          )
        true
      )
    )
    (map-set merchant-profiles { merchant: tx-sender } {
      slug: slug,
      display-name: display-name,
      settlement-wallet: settlement-wallet,
      default-currency: default-currency,
      updated-at: (current-time),
    })
    (ok tx-sender)
  )
)

(define-public (create-invoice
    (recipient principal)
    (amount uint)
    (currency (string-ascii 10))
    (expires-in-seconds uint)
    (description (string-utf8 256))
    (metadata (string-utf8 256))
    (email (string-utf8 256))
    (webhook (optional (string-ascii 256)))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (id (new-invoice-id))
      (idx (var-get invoice-total))
      (now (current-time))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (valid-principal recipient) ERR_INVALID_PRINCIPAL)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (valid-currency currency) ERR_INVALID_INPUT)
    (asserts! (> expires-in-seconds u0) ERR_INVALID_INPUT)
    (match webhook
      w (asserts! (is-eq (slice? w u0 u5) (some "https")) ERR_INVALID_WEBHOOK)
      true
    )
    (map-set invoices { invoice-id: id } {
      merchant: tx-sender,
      recipient: recipient,
      amount: amount,
      currency: currency,
      status: STATUS_PENDING,
      created-at: now,
      expires-at: (+ now expires-in-seconds),
      paid-at: none,
      description: description,
      metadata: metadata,
      email: email,
      payment-address: none,
      webhook-url: (if (is-some webhook) webhook (get webhook-url merchant)),
    })
    (map-set invoice-index { index: idx } { invoice-id: id })
    (var-set invoice-total (+ idx u1))
    (ok id)
  )
)

(define-public (create-invoice-payment-link
    (slug (string-ascii 64))
    (invoice-id (string-ascii 85))
    (title (string-utf8 128))
    (description (string-utf8 256))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (invoice (unwrap! (map-get? invoices { invoice-id: invoice-id }) ERR_INVOICE_NOT_FOUND))
      (link-id (new-payment-link-id))
      (idx (var-get payment-link-total))
      (now (current-time))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get merchant invoice) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? payment-link-slugs { slug: slug })) ERR_DUPLICATE_SLUG)
    (persist-payment-link
      link-id
      slug
      LINK_KIND_INVOICE
      (some invoice-id)
      none
      title
      description
      (some (get currency invoice))
      (some (get amount invoice))
      none
      false
      (is-eq (get currency invoice) CURRENCY_STX)
      (is-eq (get currency invoice) CURRENCY_SBTC)
      (is-eq (get currency invoice) CURRENCY_USDC)
      false
      true
      now
    )
    (map-set payment-link-slugs { slug: slug } { link-id: link-id })
    (map-set payment-link-index { index: idx } { link-id: link-id })
    (var-set payment-link-total (+ idx u1))
    (ok link-id)
  )
)

(define-public (create-multipay-link
    (slug (string-ascii 64))
    (title (string-utf8 128))
    (description (string-utf8 256))
    (default-currency (optional (string-ascii 10)))
    (default-amount (optional uint))
    (amount-step (optional uint))
    (allow-custom-amount bool)
    (accepts-stx bool)
    (accepts-sbtc bool)
    (accepts-usdcx bool)
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (link-id (new-payment-link-id))
      (idx (var-get payment-link-total))
      (now (current-time))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? payment-link-slugs { slug: slug })) ERR_DUPLICATE_SLUG)
    (asserts! (> (accepted-currency-count accepts-stx accepts-sbtc accepts-usdcx) u0) ERR_INVALID_INPUT)
    (match default-currency
      currency
        (begin
          (asserts! (valid-currency currency) ERR_INVALID_INPUT)
          (asserts! (currency-enabled currency accepts-stx accepts-sbtc accepts-usdcx) ERR_INVALID_INPUT)
        )
      true
    )
    (match default-amount
      amount (asserts! (> amount u0) ERR_INVALID_AMOUNT)
      true
    )
    (match amount-step
      step (asserts! (> step u0) ERR_INVALID_AMOUNT)
      true
    )
    (persist-payment-link
      link-id
      slug
      LINK_KIND_MULTIPAY
      none
      none
      title
      description
      default-currency
      default-amount
      amount-step
      allow-custom-amount
      accepts-stx
      accepts-sbtc
      accepts-usdcx
      false
      true
      now
    )
    (map-set payment-link-slugs { slug: slug } { link-id: link-id })
    (map-set payment-link-index { index: idx } { link-id: link-id })
    (var-set payment-link-total (+ idx u1))
    (ok link-id)
  )
)

(define-public (create-universal-qr-link
    (slug (string-ascii 64))
    (title (string-utf8 128))
    (description (string-utf8 256))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (link-id (new-payment-link-id))
      (idx (var-get payment-link-total))
      (now (current-time))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? payment-link-slugs { slug: slug })) ERR_DUPLICATE_SLUG)
    (match (map-get? merchant-universal-link { merchant: tx-sender })
      active-link-ref
        (let ((existing-link-id (get link-id active-link-ref)))
          (match (map-get? payment-links { link-id: existing-link-id })
            existing-link
              (map-set payment-links { link-id: existing-link-id }
                (merge existing-link {
                  is-active: false,
                  updated-at: now,
                })
              )
            true
          )
        )
      true
    )
    (persist-payment-link
      link-id
      slug
      LINK_KIND_MULTIPAY
      none
      none
      title
      description
      none
      none
      none
      true
      true
      true
      true
      true
      true
      now
    )
    (map-set merchant-universal-link { merchant: tx-sender } { link-id: link-id })
    (map-set payment-link-slugs { slug: slug } { link-id: link-id })
    (map-set payment-link-index { index: idx } { link-id: link-id })
    (var-set payment-link-total (+ idx u1))
    (ok link-id)
  )
)

(define-public (create-subscription-payment-link
    (slug (string-ascii 64))
    (plan-id (string-ascii 85))
    (title (string-utf8 128))
    (description (string-utf8 256))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (plan (unwrap! (map-get? subscription-plans { plan-id: plan-id }) ERR_PLAN_NOT_FOUND))
      (link-id (new-payment-link-id))
      (idx (var-get payment-link-total))
      (now (current-time))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get merchant plan) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-none (map-get? payment-link-slugs { slug: slug })) ERR_DUPLICATE_SLUG)
    (persist-payment-link
      link-id
      slug
      LINK_KIND_SUBSCRIPTION
      none
      (some plan-id)
      title
      description
      (some (get currency plan))
      (some (get amount plan))
      none
      false
      (is-eq (get currency plan) CURRENCY_STX)
      (is-eq (get currency plan) CURRENCY_SBTC)
      (is-eq (get currency plan) CURRENCY_USDC)
      false
      true
      now
    )
    (map-set payment-link-slugs { slug: slug } { link-id: link-id })
    (map-set payment-link-index { index: idx } { link-id: link-id })
    (var-set payment-link-total (+ idx u1))
    (ok link-id)
  )
)

(define-public (set-payment-link-active
    (link-id (string-ascii 85))
    (active bool)
  )
  (let ((link (unwrap! (map-get? payment-links { link-id: link-id }) ERR_LINK_NOT_FOUND)))
    (asserts! (is-eq (get merchant link) tx-sender) ERR_UNAUTHORIZED)
    (if (and active (get is-universal link))
      (match (map-get? merchant-universal-link { merchant: tx-sender })
        active-link-ref
          (let ((existing-link-id (get link-id active-link-ref)))
            (if (not (is-eq existing-link-id link-id))
              (match (map-get? payment-links { link-id: existing-link-id })
                existing-link
                  (map-set payment-links { link-id: existing-link-id }
                    (merge existing-link {
                      is-active: false,
                      updated-at: (current-time),
                    })
                  )
                true
              )
              true
            )
          )
        true
      )
      true
    )
    (map-set payment-links { link-id: link-id }
      (merge link {
        is-active: active,
        updated-at: (current-time),
      })
    )
    (if (get is-universal link)
      (if active
        (map-set merchant-universal-link { merchant: tx-sender } { link-id: link-id })
        (match (map-get? merchant-universal-link { merchant: tx-sender })
          active-link-ref
            (if (is-eq (get link-id active-link-ref) link-id)
              (begin
                (map-delete merchant-universal-link { merchant: tx-sender })
                true
              )
              true
            )
          true
        )
      )
      true
    )
    (ok true)
  )
)

(define-public (create-subscription-plan
    (name (string-utf8 128))
    (amount uint)
    (currency (string-ascii 10))
    (interval-seconds uint)
    (metadata (string-utf8 256))
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (plan-id (new-plan-id))
      (idx (var-get subscription-plan-total))
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (valid-currency currency) ERR_INVALID_INPUT)
    (asserts! (> interval-seconds u0) ERR_INVALID_TIME)
    (map-set subscription-plans { plan-id: plan-id } {
      merchant: tx-sender,
      name: name,
      amount: amount,
      currency: currency,
      interval-seconds: interval-seconds,
      status: PLAN_STATUS_ACTIVE,
      created-at: (current-time),
      metadata: metadata,
    })
    (map-set subscription-plan-index { index: idx } { plan-id: plan-id })
    (var-set subscription-plan-total (+ idx u1))
    (ok plan-id)
  )
)

(define-public (create-subscription
    (plan-id (string-ascii 85))
    (subscriber principal)
    (first-billing-at uint)
  )
  (let (
      (plan (unwrap! (map-get? subscription-plans { plan-id: plan-id }) ERR_PLAN_NOT_FOUND))
      (subscription-id (new-subscription-id))
      (idx (var-get subscription-total))
    )
    (asserts! (is-eq (get merchant plan) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (valid-principal subscriber) ERR_INVALID_PRINCIPAL)
    (asserts! (>= first-billing-at (current-time)) ERR_INVALID_TIME)
    (asserts! (is-eq (get status plan) PLAN_STATUS_ACTIVE) ERR_INVALID_STATUS)
    (map-set subscriptions { subscription-id: subscription-id } {
      plan-id: plan-id,
      merchant: tx-sender,
      subscriber: subscriber,
      status: SUBSCRIPTION_STATUS_ACTIVE,
      next-billing-at: first-billing-at,
      last-invoice-id: none,
      created-at: (current-time),
    })
    (map-set subscription-index { index: idx } { subscription-id: subscription-id })
    (var-set subscription-total (+ idx u1))
    (ok subscription-id)
  )
)

(define-public (set-subscription-status
    (subscription-id (string-ascii 85))
    (status uint)
  )
  (let ((subscription (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) ERR_SUBSCRIPTION_NOT_FOUND)))
    (asserts! (is-eq (get merchant subscription) tx-sender) ERR_UNAUTHORIZED)
    (asserts!
      (or
        (is-eq status SUBSCRIPTION_STATUS_ACTIVE)
        (or
          (is-eq status SUBSCRIPTION_STATUS_PAUSED)
          (is-eq status SUBSCRIPTION_STATUS_CANCELED)
        )
      )
      ERR_INVALID_STATUS
    )
    (map-set subscriptions { subscription-id: subscription-id }
      (merge subscription { status: status })
    )
    (ok true)
  )
)

(define-public (record-subscription-renewal
    (subscription-id (string-ascii 85))
    (invoice-id (string-ascii 85))
    (next-billing-at uint)
  )
  (let (
      (subscription (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) ERR_SUBSCRIPTION_NOT_FOUND))
      (invoice (unwrap! (map-get? invoices { invoice-id: invoice-id }) ERR_INVOICE_NOT_FOUND))
    )
    (asserts! (is-eq (get merchant subscription) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get merchant invoice) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> next-billing-at (current-time)) ERR_INVALID_TIME)
    (map-set subscriptions { subscription-id: subscription-id }
      (merge subscription {
        last-invoice-id: (some invoice-id),
        next-billing-at: next-billing-at,
      })
    )
    (print {
      event: "subscription-renewal-recorded",
      subscription-id: subscription-id,
      invoice-id: invoice-id,
    })
    (ok true)
  )
)

(define-public (create-settlement-policy
    (destination principal)
    (currency (string-ascii 10))
    (trigger-kind uint)
    (threshold (optional uint))
    (cadence-seconds (optional uint))
    (min-payout uint)
  )
  (let (
      (merchant (unwrap! (map-get? merchants { merchant: tx-sender }) ERR_UNAUTHORIZED))
      (policy-id (new-policy-id))
      (idx (var-get settlement-policy-total))
      (now (current-time))
      (next-settlement-at
        (if (is-eq trigger-kind SETTLEMENT_TRIGGER_SCHEDULED)
          (match cadence-seconds
            cadence (some (+ now cadence))
            none
          )
          none
        )
      )
    )
    (asserts! (get is-active merchant) ERR_UNAUTHORIZED)
    (asserts! (valid-principal destination) ERR_INVALID_PRINCIPAL)
    (asserts! (valid-currency currency) ERR_INVALID_INPUT)
    (asserts! (> min-payout u0) ERR_INVALID_AMOUNT)
    (asserts!
      (or
        (is-eq trigger-kind SETTLEMENT_TRIGGER_THRESHOLD)
        (is-eq trigger-kind SETTLEMENT_TRIGGER_SCHEDULED)
      )
      ERR_INVALID_INPUT
    )
    (if (is-eq trigger-kind SETTLEMENT_TRIGGER_THRESHOLD)
      (match threshold
        amount-threshold (asserts! (> amount-threshold u0) ERR_INVALID_AMOUNT)
        (asserts! false ERR_INVALID_INPUT)
      )
      (match cadence-seconds
        cadence (asserts! (> cadence u0) ERR_INVALID_TIME)
        (asserts! false ERR_INVALID_INPUT)
      )
    )
    (map-set settlement-policies { policy-id: policy-id } {
      merchant: tx-sender,
      destination: destination,
      currency: currency,
      trigger-kind: trigger-kind,
      threshold: threshold,
      cadence-seconds: cadence-seconds,
      next-settlement-at: next-settlement-at,
      min-payout: min-payout,
      active: true,
      created-at: now,
    })
    (map-set settlement-policy-index { index: idx } { policy-id: policy-id })
    (var-set settlement-policy-total (+ idx u1))
    (ok policy-id)
  )
)

(define-public (set-settlement-policy-active
    (policy-id (string-ascii 85))
    (active bool)
  )
  (let ((policy (unwrap! (map-get? settlement-policies { policy-id: policy-id }) ERR_POLICY_NOT_FOUND)))
    (asserts! (is-eq (get merchant policy) tx-sender) ERR_UNAUTHORIZED)
    (map-set settlement-policies { policy-id: policy-id }
      (merge policy { active: active })
    )
    (ok true)
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
    (let ((invoice (unwrap! (map-get? invoices { invoice-id: invoice-id }) ERR_INVOICE_NOT_FOUND)))
      (asserts! (is-eq (get status invoice) STATUS_PENDING) ERR_INVOICE_ALREADY_PAID)
      (asserts! (is-eq amount (get amount invoice)) ERR_INSUFFICIENT_PAYMENT)
      (asserts! (< (current-time) (get expires-at invoice)) ERR_INVALID_STATUS)
      (map-set invoices { invoice-id: invoice-id }
        (merge invoice {
          status: STATUS_PAID,
          paid-at: (some (current-time)),
        })
      )
      (let (
          (receipt-id (new-receipt-id))
          (idx (var-get receipt-total))
        )
        (map-set receipts { receipt-id: receipt-id } {
          invoice-id: invoice-id,
          payer: payer,
          amount-paid: amount,
          tx-id: txid,
          timestamp: (current-time),
        })
        (print {
          event: "invoice-paid",
          invoice-id: invoice-id,
          receipt-id: receipt-id,
          amount: amount,
        })
        (map-set receipt-index { index: idx } { receipt-id: receipt-id })
        (var-set receipt-total (+ idx u1))
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

;; read-only functions
(define-read-only (get-merchant (who principal))
  (map-get? merchants { merchant: who })
)

(define-read-only (get-merchant-profile (who principal))
  (map-get? merchant-profiles { merchant: who })
)

(define-read-only (get-merchant-by-slug (slug (string-ascii 64)))
  (map-get? merchant-slugs { slug: slug })
)

(define-read-only (get-invoice (invoice-id (string-ascii 85)))
  (map-get? invoices { invoice-id: invoice-id })
)

(define-read-only (get-receipt (receipt-id (string-ascii 85)))
  (map-get? receipts { receipt-id: receipt-id })
)

(define-read-only (get-payment-link (link-id (string-ascii 85)))
  (map-get? payment-links { link-id: link-id })
)

(define-read-only (get-payment-link-by-slug (slug (string-ascii 64)))
  (match (map-get? payment-link-slugs { slug: slug })
    link-ref (map-get? payment-links { link-id: (get link-id link-ref) })
    none
  )
)

(define-read-only (get-active-universal-link (merchant principal))
  (match (map-get? merchant-universal-link { merchant: merchant })
    link-ref
      (match (map-get? payment-links { link-id: (get link-id link-ref) })
        link
          (if (get is-active link)
            (some link)
            none
          )
        none
      )
    none
  )
)

(define-read-only (get-subscription-plan (plan-id (string-ascii 85)))
  (map-get? subscription-plans { plan-id: plan-id })
)

(define-read-only (get-subscription (subscription-id (string-ascii 85)))
  (map-get? subscriptions { subscription-id: subscription-id })
)

(define-read-only (get-settlement-policy (policy-id (string-ascii 85)))
  (map-get? settlement-policies { policy-id: policy-id })
)

(define-read-only (get-invoice-count)
  (ok (var-get invoice-total))
)

(define-read-only (get-receipt-count)
  (ok (var-get receipt-total))
)

(define-read-only (get-payment-link-count)
  (ok (var-get payment-link-total))
)

(define-read-only (get-subscription-plan-count)
  (ok (var-get subscription-plan-total))
)

(define-read-only (get-subscription-count)
  (ok (var-get subscription-total))
)

(define-read-only (get-settlement-policy-count)
  (ok (var-get settlement-policy-total))
)

(define-read-only (get-invoice-id (i uint))
  (map-get? invoice-index { index: i })
)

(define-read-only (get-receipt-id (i uint))
  (map-get? receipt-index { index: i })
)

(define-read-only (get-payment-link-id (i uint))
  (map-get? payment-link-index { index: i })
)

(define-read-only (get-subscription-plan-id (i uint))
  (map-get? subscription-plan-index { index: i })
)

(define-read-only (get-subscription-id (i uint))
  (map-get? subscription-index { index: i })
)

(define-read-only (get-settlement-policy-id (i uint))
  (map-get? settlement-policy-index { index: i })
)

(define-read-only (get-current-time)
  (ok (current-time))
)

(define-read-only (is-invoice-payable (invoice-id (string-ascii 85)))
  (match (map-get? invoices { invoice-id: invoice-id })
    invoice (and
      (is-eq (get status invoice) STATUS_PENDING)
      (< (current-time) (get expires-at invoice))
    )
    false
  )
)
