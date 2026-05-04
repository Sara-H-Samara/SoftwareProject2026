using System.Text;
using System.Linq;
using VirtualArtGallery.Application.DTOs.Orders;

namespace VirtualArtGallery.Application.Services;

public class InvoiceService
{
    public string GenerateHtml(OrderDto order, string userName, string userEmail)
    {
        var itemsHtml = new StringBuilder();
        var subtotal = order.Items?.Sum(i => i.Price * i.Quantity) ?? 0;
        var tax = subtotal * 0.05m;
        var total = subtotal + tax;
        
        if (order.Items != null && order.Items.Any())
        {
            foreach (var item in order.Items)
            {
                itemsHtml.Append($@"
                    <tr class='item-row'>
                        <td class='item-cell' style='padding: 16px; border-bottom: 1px solid #e2e8f0;'>
                            <div class='item-title' style='font-weight: 600; color: #1a202c;'>{System.Net.WebUtility.HtmlEncode(item.Title ?? "N/A")}</div>
                            <div class='item-artist' style='font-size: 12px; color: #718096; margin-top: 4px;'>by {System.Net.WebUtility.HtmlEncode(item.ArtistName ?? "Unknown Artist")}</div>
                        </td>
                        <td class='price-cell' style='padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #2d3748;'>${item.Price:F2}</td>
                        <td class='qty-cell' style='padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #2d3748;'>{item.Quantity}</td>
                        <td class='total-cell' style='padding: 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #2d3748;'>${(item.Price * item.Quantity):F2}</td>
                    </tr>
                ");
            }
        }
        else
        {
            itemsHtml.Append(@"
                <tr>
                    <td colspan='4' style='padding: 48px; text-align: center; color: #a0aec0;'>
                        <svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' style='margin: 0 auto 12px;'>
                            <path d='M20 7L4 7' stroke='currentColor' stroke-linecap='round'/>
                            <path d='M9 12L15 12' stroke='currentColor' stroke-linecap='round'/>
                            <rect x='3' y='3' width='18' height='18' rx='2' stroke='currentColor'/>
                            <path d='M16 21L21 16' stroke='currentColor' stroke-linecap='round'/>
                            <path d='M21 21L16 16' stroke='currentColor' stroke-linecap='round'/>
                        </svg>
                        No items found in this order
                    </td>
                </tr>
            ");
        }

        return $@"
            <!DOCTYPE html>
            <html lang='en'>
            <head>
                <meta charset='utf-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Invoice | Virtual Art Gallery</title>
                <style>
                    * {{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }}
                    
                    body {{
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
                        min-height: 100vh;
                        padding: 40px 20px;
                    }}
                    
                    .invoice-wrapper {{
                        max-width: 900px;
                        margin: 0 auto;
                        animation: fadeIn 0.5s ease-out;
                    }}
                    
                    @keyframes fadeIn {{
                        from {{ opacity: 0; transform: translateY(20px); }}
                        to {{ opacity: 1; transform: translateY(0); }}
                    }}
                    
                    .invoice-card {{
                        background: white;
                        border-radius: 24px;
                        box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02);
                        overflow: hidden;
                    }}
                    
                    /* Header */
                    .invoice-header {{
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        padding: 40px 48px;
                        position: relative;
                        overflow: hidden;
                    }}
                    
                    .invoice-header::before {{
                        content: '';
                        position: absolute;
                        top: -50%;
                        right: -20%;
                        width: 300px;
                        height: 300px;
                        background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
                        border-radius: 50%;
                        pointer-events: none;
                    }}
                    
                    .invoice-header::after {{
                        content: '';
                        position: absolute;
                        bottom: -30%;
                        left: -10%;
                        width: 250px;
                        height: 250px;
                        background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%);
                        border-radius: 50%;
                        pointer-events: none;
                    }}
                    
                    .logo-section {{
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 24px;
                        position: relative;
                        z-index: 1;
                    }}
                    
                    .logo-icon {{
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: 700;
                        color: white;
                        box-shadow: 0 8px 20px -5px rgba(139, 92, 246, 0.4);
                    }}
                    
                    .logo-text {{
                        font-size: 20px;
                        font-weight: 600;
                        color: white;
                        letter-spacing: -0.3px;
                    }}
                    
                    .logo-text span {{
                        font-weight: 400;
                        color: rgba(255, 255, 255, 0.7);
                    }}
                    
                    .invoice-title {{
                        font-size: 48px;
                        font-weight: 800;
                        color: white;
                        letter-spacing: -1px;
                        margin-bottom: 8px;
                        position: relative;
                        z-index: 1;
                    }}
                    
                    .invoice-subtitle {{
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 14px;
                        position: relative;
                        z-index: 1;
                    }}
                    
                    /* Content */
                    .invoice-content {{
                        padding: 40px 48px;
                    }}
                    
                    /* Order Info Grid */
                    .info-grid {{
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 24px;
                        background: #f8fafc;
                        padding: 24px;
                        border-radius: 20px;
                        margin-bottom: 32px;
                        border: 1px solid #e2e8f0;
                    }}
                    
                    .info-item {{
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }}
                    
                    .info-label {{
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #64748b;
                    }}
                    
                    .info-value {{
                        font-size: 16px;
                        font-weight: 600;
                        color: #0f172a;
                    }}
                    
                    .info-value.small {{
                        font-size: 13px;
                        font-weight: 400;
                        color: #334155;
                        font-family: monospace;
                    }}
                    
                    /* Items Table */
                    .items-table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 32px;
                    }}
                    
                    .items-table th {{
                        text-align: left;
                        padding: 16px 0 12px 0;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #64748b;
                        border-bottom: 2px solid #e2e8f0;
                    }}
                    
                    .items-table th:not(:first-child) {{
                        text-align: right;
                    }}
                    
                    .items-table th:nth-child(2) {{
                        text-align: right;
                    }}
                    
                    .items-table th:last-child {{
                        text-align: right;
                    }}
                    
                    .item-title {{
                        font-weight: 600;
                        color: #1e293b;
                    }}
                    
                    .item-artist {{
                        font-size: 12px;
                        color: #94a3b8;
                        margin-top: 4px;
                    }}
                    
                    /* Summary Section */
                    .summary {{
                        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                        border-radius: 20px;
                        padding: 24px;
                        margin-top: 24px;
                        border: 1px solid #e2e8f0;
                    }}
                    
                    .summary-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        font-size: 14px;
                        color: #475569;
                    }}
                    
                    .summary-row.highlight {{
                        border-top: 2px solid #e2e8f0;
                        margin-top: 8px;
                        padding-top: 16px;
                        font-size: 18px;
                        font-weight: 700;
                        color: #0f172a;
                    }}
                    
                    .summary-row.highlight .summary-value {{
                        color: #8b5cf6;
                        font-size: 24px;
                    }}
                    
                    /* Footer */
                    .invoice-footer {{
                        background: #f1f5f9;
                        padding: 24px 48px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    }}
                    
                    .footer-text {{
                        color: #64748b;
                        font-size: 12px;
                        margin-bottom: 16px;
                    }}
                    
                    .print-button {{
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
                        color: white;
                        border: none;
                        padding: 12px 28px;
                        border-radius: 40px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                    }}
                    
                    .print-button:hover {{
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
                    }}
                    
                    .print-button:active {{
                        transform: translateY(0);
                    }}
                    
                    @media print {{
                        body {{
                            background: white;
                            padding: 0;
                        }}
                        .invoice-wrapper {{
                            max-width: 100%;
                            margin: 0;
                        }}
                        .invoice-card {{
                            box-shadow: none;
                            border-radius: 0;
                        }}
                        .print-button {{
                            display: none;
                        }}
                        .invoice-header {{
                            background: #1e293b;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }}
                        .summary-row.highlight .summary-value {{
                            color: #8b5cf6;
                        }}
                    }}
                    
                    @media (max-width: 640px) {{
                        .invoice-header {{
                            padding: 24px;
                        }}
                        .invoice-content {{
                            padding: 24px;
                        }}
                        .invoice-title {{
                            font-size: 32px;
                        }}
                        .info-grid {{
                            grid-template-columns: 1fr;
                            gap: 16px;
                        }}
                        .items-table th,
                        .items-table td {{
                            padding: 12px 8px;
                        }}
                        .item-artist {{
                            display: none;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class='invoice-wrapper'>
                    <div class='invoice-card'>
                        <div class='invoice-header'>
                            <div class='logo-section'>
                                <div class='logo-icon'>V</div>
                                <div class='logo-text'>Virtual Art <span>Gallery</span></div>
                            </div>
                            <h1 class='invoice-title'>INVOICE</h1>
                            <p class='invoice-subtitle'>Official receipt of your art purchase</p>
                        </div>
                        
                        <div class='invoice-content'>
                            <div class='info-grid'>
                                <div class='info-item'>
                                    <span class='info-label'>Order ID</span>
                                    <span class='info-value small'>#{order.Id.ToString().Substring(0, 8).ToUpper()}</span>
                                </div>
                                <div class='info-item'>
                                    <span class='info-label'>Date</span>
                                    <span class='info-value'>{DateTime.UtcNow:MMMM dd, yyyy}</span>
                                </div>
                                <div class='info-item'>
                                    <span class='info-label'>Customer</span>
                                    <span class='info-value'>{System.Net.WebUtility.HtmlEncode(userName)}</span>
                                </div>
                                <div class='info-item'>
                                    <span class='info-label'>Email</span>
                                    <span class='info-value small'>{System.Net.WebUtility.HtmlEncode(userEmail)}</span>
                                </div>
                            </div>
                            
                            <table class='items-table'>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsHtml}
                                </tbody>
                            </table>
                            
                            <div class='summary'>
                                <div class='summary-row'>
                                    <span>Subtotal</span>
                                    <span>${subtotal:F2}</span>
                                </div>
                                <div class='summary-row'>
                                    <span>Tax (5%)</span>
                                    <span>${tax:F2}</span>
                                </div>
                                <div class='summary-row highlight'>
                                    <span>Total Amount</span>
                                    <span class='summary-value'>${total:F2}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class='invoice-footer'>
                            <p class='footer-text'>Thank you for supporting the arts! Your purchase helps artists thrive.</p>
                            <button class='print-button' onclick='window.print()'>
                                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'>
                                    <path d='M6 18L18 18' stroke='currentColor' stroke-linecap='round'/>
                                    <path d='M6 14L18 14' stroke='currentColor' stroke-linecap='round'/>
                                    <path d='M8 10L16 10' stroke='currentColor' stroke-linecap='round'/>
                                    <rect x='4' y='4' width='16' height='16' rx='2' stroke='currentColor'/>
                                    <path d='M8 2L16 2' stroke='currentColor' stroke-linecap='round'/>
                                </svg>
                                Print / Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        ";
    }
}