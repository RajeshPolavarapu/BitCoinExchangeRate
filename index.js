const express = require('express')
const cron = require("node-cron");
const axios=require('axios')
const app = express()
const morgan= require('morgan');
const port = 3000
var cache={}
let exchanges=["binance", "binanceus", "bittrex", "bittrexinternational", "kucoin"]//, "coinbasepro", "poloniex", "kraken", "bibox", "gemini", "huobi", "huobiglobal", "hitbtc", "bitmart", "bitstamp", "okex", "bitfinex"]
let symbols=["BTC", "ETH", "USDT", "NEO", "VET", "KCS", "OLT", "TFD", "CBC", "CPC", "DAG", "EGT", "ELA", "XLM", "CS", "AOA", "ETN", "WAN", "DACC", "DOCK", "KICK", "GO", "BAX", "LYM", "ONT", "QKC", "DATX", "IOTX", "LOOM", "OPEN", "SOUL", "TOMO", "TRAC", "COV", "ELF", "MAN", "ZIL", "BPT", "TKY", "CAPP", "NANO", "CXO", "MTN", "TEL", "WAX", "COFI", "ADB", "BOS", "HPB", "IOST", "DBC", "KEY", "R", "CV", "LTC", "ACAT", "DRGN", "ITC", "EXY", "MWAT", "AGI", "DENT", "ACT", "EOS", "ETC", "GAS", "AXPR", "PLAY", "CHP", "UTK", "DASH", "FOTA", "CAG", "SNX", "TIME", "ENJ", "WTC", "AION", "QTUM", "DGB", "AMB", "BTM", "MANA", "CHSB", "OMG", "TFL", "KNC", "BCD", "POWR", "PPT", "GVT", "SNT", "NEBL", "CVC", "NULS", "REQ", "LOC", "ZRX", "TRX", "MVP"]
cron.schedule("* * * * *", function() {
        updateCache();
  });
app.use(morgan('dev'));
app.use('/exchange-rate',function (req, res, next) {
    if(typeof req.query.exchange != "string")
         res.send({err:`STRING TYPE EXPECTED FOR EXCHANGE`})
    if(exchanges.indexOf(String(req.query.exchange).toLowerCase())<0)
         res.send({err:`EXCHANGE ${req.query.exchange} NOT SUPPORTED`})
    if(typeof req.query.fromCurrency != "string")
         res.send({err:`STRING TYPE EXPECTED FOR FromCurrency`})
    if(symbols.indexOf(String(req.query.fromCurrency).toUpperCase())<0)
         res.send({err:`FROM CURRENCY ${req.query.fromCurrency} NOT SUPPORTED`})
    if(typeof req.query.toCurrency != "string")
         res.send({err:`STRING TYPE EXPECTED FOR toCurrency`})
    if(symbols.indexOf(String(req.query.toCurrency).toUpperCase())<0)
         res.send({err:`TO CURRENCY ${req.query.toCurrency} NOT SUPPORTED`})
    next()
  })
app.get('/cache',(req,res)=>res.send(cache));
app.get('/exchange-rate', (req, res) =>{
    let exchange=req.query.exchange.toLowerCase();
    let toCurrency=req.query.toCurrency.toUpperCase();
    let fromCurrency=req.query.fromCurrency.toUpperCase();
    if(cache[exchange]&&cache[exchange][fromCurrency]&&cache[exchange]&&cache[exchange][fromCurrency])
                res.send({
                    "rate": cache[exchange][fromCurrency]/cache[exchange][toCurrency]
                });
    else            
      axios.get("https://dev-api.shrimpy.io/v1/exchanges/"+req.query.exchange+"/ticker").then(
        (result)=>{
            let array=result.data;
            let from=array.find((crpto)=>crpto.symbol==fromCurrency)
            let to=array.find((crpto)=>crpto.symbol==toCurrency)
            res.send({
                "rate": from.priceUsd/to.priceUsd
            })
        }
    ).catch((err)=>{
        // console.log(err)
    }
    )
})

app.listen(port, () => console.log(`Application started at http://localhost:${port}`))
app.on('listening', function () {
    updateCache();
});


function updateCache(){
    console.log("updated cache at ",new Date());
    for(let i=0;i<exchanges.length;i++)
        ((x)=>{axios.get("https://dev-api.shrimpy.io/v1/exchanges/"+exchanges[x]+"/ticker").then(
             (res)=>{
                        if(cache[exchanges[x]]==undefined)
                                cache[exchanges[x]]={}
                        res.data.forEach((crypto)=>{ cache[exchanges[x]][crypto.symbol]=crypto.priceUsd})
             }
      
        ).catch((err)=>console.log(err))
        })(i)
}