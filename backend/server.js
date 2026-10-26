const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const BILLZ_TOKEN = process.env.BILLZ_API_TOKEN;
const ADMIN_PERCENT = parseFloat(process.env.ADMIN_COMMISSION_PERCENT) || 3;

// 1. BILLZ API orqali tovarlar va narxlarni olish (F5 bosilganda real-vaqtda keladi)
app.get('/api/products', async (req, res) => {
    try {
        // BILLZ API ga so'rov yuborish
        const response = await axios.get('https://api.billz.io/v1/products', {
            headers: {
                'Authorization': `Bearer ${BILLZ_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const rawProducts = response.data || [];

        // Har bir mahsulotga 1 oylik Murabaha ustamasi (+8%) va Admin ulushini biriktirish
        const formattedProducts = rawProducts.map(item => {
            const cashPrice = item.price || 0;
            const murabahaPrice = Math.round(cashPrice * 1.08); // 1 oylik muddatli narx
            const adminShare = Math.round((cashPrice * ADMIN_PERCENT) / 100);

            return {
                id: item.id || Math.random().toString(),
                name: item.name || 'Maishiy texnika',
                category: item.category || 'Texnika',
                cashPrice: cashPrice,
                murabahaPrice: murabahaPrice,
                stock: item.quantity || 1,
                image: item.image || 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
                adminSharePerSale: adminShare
            };
        });

        res.json(formattedProducts);
    } catch (error) {
        console.error("BILLZ API bilan bog'lanishda xatolik:", error.message);
        
        // Zaxira demo ma'lumotlar (BILLZ API vaqtincha javob bermasa)
        res.json([
            {
                id: "demo-1",
                name: "Muzlatgich LG Smart Inverter 340L",
                category: "Muzlatgichlar",
                cashPrice: 6500000,
                murabahaPrice: 7020000,
                stock: 5,
                image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500",
                adminSharePerSale: 195000
            },
            {
                id: "demo-2",
                name: "Kir yuvish mashinasi Samsung 7kg",
                category: "Kir yuvish mashinalari",
                cashPrice: 4800000,
                murabahaPrice: 5184000,
                stock: 3,
                image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500",
                adminSharePerSale: 144000
            }
        ]);
    }
});

// 2. Buyurtmalarni qabul qilish va Admin ulushini hisoblash
app.post('/api/orders', (req, res) => {
    const { customerName, phone, district, paymentType, items, totalPrice } = req.body;

    let totalAdminProfit = 0;
    items.forEach(item => {
        const itemPrice = paymentType === 'murabaha' ? item.murabahaPrice : item.cashPrice;
        totalAdminProfit += Math.round((itemPrice * ADMIN_PERCENT) / 100);
    });

    console.log(`[YANGI BUYURTMA] ${customerName} (${phone}) - Tuman: ${district}`);
    console.log(`[ADMIN ULUSHI] Ushbu savdodan hisoblangan ulush: ${totalAdminProfit} so'm`);

    res.json({
        success: true,
        message: "Buyurtmangiz qabul qilindi! Operatorlarimiz tez orada bog'lanishadi.",
        orderId: "BM-" + Math.floor(100000 + Math.random() * 900000),
        adminProfitCalculated: totalAdminProfit
    });
});

app.listen(PORT, () => {
    console.log(`Baraka Market Backend serveri ${PORT}-portda muvaffaqiyatli ishlamoqda...`);
});