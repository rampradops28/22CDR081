const express = require('express');
const axios = require('axios');
require('dotenv').config(); 
const app = express();
 
const calculateCorrelation = (prices1, prices2) => {
    const n = prices1.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += prices1[i];
        sumY += prices2[i];
        sumXY += prices1[i] * prices2[i];
        sumX2 += prices1[i] * prices1[i];
        sumY2 += prices2[i] * prices2[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return numerator / denominator;
};

app.get('/stocks/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const { minutes } = req.query;

    try {
        const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`, {
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`  
            }
        });

        const prices = response.data;
        const avgPrice = prices.reduce((sum, priceData) => sum + priceData.price, 0) / prices.length;

        res.json({
            averageStockPrice: avgPrice,
            priceHistory: prices,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});
 
app.get('/stockcorrelation', async (req, res) => {
    const { minutes, ticker1, ticker2 } = req.query;

    try {
        const response1 = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker1}?minutes=${minutes}`, {
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`   
            }
        });
        const response2 = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker2}?minutes=${minutes}`, {
            headers: {
                Authorization: `Bearer ${process.env.API_TOKEN}`  
            }
        });

        const prices1 = response1.data.map((priceData) => priceData.price);
        const prices2 = response2.data.map((priceData) => priceData.price);

        const correlation = calculateCorrelation(prices1, prices2);

        res.json({
            correlation,
            stocks: {
                [ticker1]: { averagePrice: prices1.reduce((sum, p) => sum + p, 0) / prices1.length, priceHistory: response1.data },
                [ticker2]: { averagePrice: prices2.reduce((sum, p) => sum + p, 0) / prices2.length, priceHistory: response2.data }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock data or calculate correlation' });
    }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Stock Price Aggregation Microservice running on port ${PORT}`);
});
