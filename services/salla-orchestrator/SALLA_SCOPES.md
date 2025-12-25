# Salla App Configuration - Minimal Scopes for 10 Workflows

## 🎯 Scope Strategy

This configuration uses **minimal scopes** required for the 10 production workflows, ensuring:
- ✅ Faster Salla partner approval
- ✅ Clear intent to merchants
- ✅ Enhanced security
- ✅ Better performance
- ✅ Easier maintenance

## 📊 Scope-to-Workflow Mapping

| Workflow | Required Scopes | Why |
|----------|----------------|-----|
| **Abandoned Cart Recovery** | `read_customers`, `read_carts`, `write_customers` | Detect carts, get customer info, trigger calls |
| **VIP Discovery** | `read_orders`, `read_customers` | Calculate LTV, segment customers |
| **Shipping Delay Mitigator** | `read_shipments`, `read_orders`, `write_orders` | Track shipments, update order status |
| **Fraud Mitigation** | `read_orders`, `write_orders` | Detect fraud patterns, hold orders |
| **Auto Return** | `read_order_returns`, `write_orders` | Process returns automatically |
| **Back-in-Stock** | `read_products`, `write_products`, `read_customers` | Monitor inventory, notify customers |
| **Low Stock Urgency** | `read_products`, `read_customers` | Check stock levels, create urgency |
| **Sentiment Rescue** | `read_reviews`, `read_customers`, `write_customers` | Monitor reviews, trigger recovery |
| **Win-Back Campaign** | `read_customers`, `read_orders`, `write_customers` | Identify churn, re-engage |
| **Knowledge Transfer** | `read_settings` | Sync store config to Twenty |

## 🔐 Configured Scopes

```python
scopes = [
    # Core
    "offline_access",  # Required for long-term access
    
    # Customer workflows (abandoned cart, VIP, win-back)
    "read_customers", "write_customers",  # For customer segmentation & updates
    "read_carts",  # For abandoned cart detection
    
    # Order workflows (shipping delay, fraud, auto-return)
    "read_orders", "write_orders",  # Core order processing
    "read_shipments",  # For shipping delay detection
    "read_order_returns",  # For automated returns
    
    # Product workflows (back-in-stock, low stock urgency)
    "read_products", "write_products",  # For inventory management
    
    # Sentiment rescue workflow
    "read_reviews",  # For customer sentiment analysis
    
    # Knowledge transfer workflow
    "read_settings",  # For store configuration data
]
```

## 🚀 Installation Flow

1. **Merchant clicks "Install App"** → Redirects to `/api/v1/auth/install`
2. **OAuth State Generated** → Stored in Redis (10 min expiry)
3. **Redirect to Salla** → With minimal scopes listed above
4. **Merchant Approves** → Salla redirects to `/api/v1/auth/callback`
5. **Token Exchange** → Code exchanged for access/refresh tokens
6. **Store Info Retrieved** → Store details fetched from Salla API
7. **Webhooks Registered** → All workflow webhooks registered automatically
8. **Initial Sync Triggered** → Full data sync started

## 📝 Environment Variables Required

```bash
# Salla API
SALLA_CLIENT_ID=your-salla-partner-id
SALLA_CLIENT_SECRET=your-salla-secret
SALLA_REDIRECT_URI=http://your-domain/api/v1/auth/callback

# Webhook Base URL
WEBHOOK_BASE_URL=http://your-domain
```

## ✅ Benefits

- **Faster Approval**: Fewer scopes = quicker Salla partner review
- **Clear Intent**: Merchants see exactly what your app does
- **Security**: Minimal access reduces attack surface
- **Rate Limiting**: Fewer API calls = better performance
- **Maintainability**: Easier to understand and audit

## 🔄 Webhook Events Registered

The app automatically registers webhooks for:
- `order.cart.created`, `order.cart.updated`
- `customer.created`, `customer.updated`
- `order.created`, `order.updated`
- `order.shipment.created`, `order.shipment.updated`
- `order.return.created`
- `product.created`, `product.updated`, `product.stock.updated`
- `review.created`, `review.updated`

## 📚 Next Steps

1. Configure Salla Partner credentials in `.env`
2. Set `WEBHOOK_BASE_URL` to your public domain
3. Test installation flow
4. Verify webhook registration
5. Monitor workflow execution

