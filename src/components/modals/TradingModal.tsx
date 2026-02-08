import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { ArrowUpRight, ArrowDownRight, Activity, Wifi, WifiOff, TrendingUp, TrendingDown, Volume2 } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

// Advanced price simulation with momentum and mean reversion
class PriceSimulator {
  private price: number;
  private momentum: number = 0;
  private volatility: number;
  private meanPrice: number;
  
  constructor(initialPrice: number, volatility: number = 0.0003) {
    this.price = initialPrice;
    this.meanPrice = initialPrice;
    this.volatility = volatility;
  }
  
  tick(): number {
    // Random walk with momentum and mean reversion
    const randomShock = (Math.random() - 0.5) * 2 * this.volatility * this.price;
    const momentumEffect = this.momentum * 0.7;
    const meanReversion = (this.meanPrice - this.price) * 0.0001;
    
    // Update momentum (persistence + new shock)
    this.momentum = momentumEffect + randomShock * 0.3;
    
    // Calculate new price
    this.price = this.price + randomShock + momentumEffect + meanReversion;
    
    // Ensure price stays positive
    this.price = Math.max(this.price * 0.5, this.price);
    
    return this.price;
  }
  
  getCurrentPrice(): number {
    return this.price;
  }
  
  setPrice(price: number): void {
    this.price = price;
    this.meanPrice = price;
  }
  
  // Generate realistic OHLC candle
  generateCandle(duration: number = 60000): { open: number; high: number; low: number; close: number; volume: number } {
    const open = this.price;
    let high = open;
    let low = open;
    let close = open;
    
    // Simulate multiple ticks within the candle
    const ticks = Math.floor(duration / 200); // ~200ms per tick
    for (let i = 0; i < ticks; i++) {
      const tickPrice = this.tick();
      high = Math.max(high, tickPrice);
      low = Math.min(low, tickPrice);
      close = tickPrice;
    }
    
    // Realistic volume based on price movement
    const priceRange = high - low;
    const baseVolume = Math.random() * 50 + 20;
    const volume = baseVolume * (1 + (priceRange / open) * 100);
    
    return { open, high, low, close, volume };
  }
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface TickerData {
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

interface RecentTrade {
  id: number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
}

// Finnhub API Configuration
const FINNHUB_API_KEY = 'd640pohr01ql6dj1oqt0d640pohr01ql6dj1oqtg';
const FINNHUB_WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`;
const FINNHUB_API_BASE = 'https://finnhub.io/api/v1';
const SYMBOL = 'BINANCE:ETHUSDT';
const SYMBOL_DISPLAY = 'ETH/USDT';

export function TradingModal({ isOpen, onClose }: TradingModalProps) {
  const { balance } = useSession();
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  
  // Real-time data states
  const [ticker, setTicker] = useState<TickerData>({
    lastPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    quoteVolume24h: 0,
  });
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCandle, setCurrentCandle] = useState<CandlestickData<Time> | null>(null);
  const [timeframe, setTimeframe] = useState('1m');
  
  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // Price simulator ref
  const priceSimulatorRef = useRef<PriceSimulator | null>(null);
  const candleDataRef = useRef<CandlestickData<Time>[]>([]);
  const volumeDataRef = useRef<{ time: Time; value: number; color: string }[]>([]);
  
  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  
  // Price flash effect
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(0);

  // Map timeframe to Finnhub resolution
  const getResolution = (tf: string): string => {
    const map: Record<string, string> = {
      '1m': '1', '5m': '5', '15m': '15', '30m': '30',
      '1h': '60', '4h': '240', '1d': 'D', '1w': 'W', '1M': 'M'
    };
    return map[tf] || '1';
  };

  // Fetch historical candles from Finnhub
  const fetchHistoricalData = useCallback(async () => {
    try {
      const resolution = getResolution(timeframe);
      const to = Math.floor(Date.now() / 1000);
      const from = to - (resolution === 'D' ? 365 * 24 * 60 * 60 : resolution === 'W' ? 730 * 24 * 60 * 60 : 7 * 24 * 60 * 60);
      
      const response = await fetch(
        `${FINNHUB_API_BASE}/crypto/candle?symbol=${SYMBOL}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.s !== 'ok' || !data.t) {
        console.warn('Finnhub returned no data, using fallback');
        return;
      }
      
      const candlesticks: CandlestickData<Time>[] = data.t.map((timestamp: number, i: number) => ({
        time: timestamp as Time,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
      }));
      
      const volumes = data.t.map((timestamp: number, i: number) => ({
        time: timestamp as Time,
        value: data.v[i],
        color: data.c[i] >= data.o[i] ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }));
      
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candlesticks);
      }
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumes);
      }
      
      // Set current candle
      if (candlesticks.length > 0) {
        setCurrentCandle(candlesticks[candlesticks.length - 1]);
      }
    } catch (error) {
      console.error('Error fetching Finnhub historical data:', error);
    }
  }, [timeframe]);

  // Fetch initial quote data
  const fetchQuoteData = useCallback(async () => {
    try {
      // Use crypto profile for 24h data approximation
      const response = await fetch(
        `${FINNHUB_API_BASE}/quote?symbol=${SYMBOL}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      
      if (data.c) {
        setTicker(prev => ({
          ...prev,
          lastPrice: data.c,
          priceChange: data.d || 0,
          priceChangePercent: data.dp || 0,
          high24h: data.h || data.c,
          low24h: data.l || data.c,
        }));
        
        if (!price) {
          setPrice(data.c.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
  }, [price]);

  // Initialize chart with simulated historical data
  useEffect(() => {
    if (!isOpen || !chartContainerRef.current) return;
    
    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e11' },
        textColor: '#787b86',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#1e222d', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#505050',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#363a45',
        },
        horzLine: {
          width: 1,
          color: '#505050',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#363a45',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2d35',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#2a2d35',
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 5,
        minBarSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        touch: true,
        mouse: true,
      },
    });

    // Candlestick series with better styling
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Current price line series
    const priceLineSeries = chart.addSeries(LineSeries, {
      color: '#f0b90b',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    priceLineSeriesRef.current = priceLineSeries;

    // Initialize price simulator with ETH starting price
    const initialPrice = 2075;
    const simulator = new PriceSimulator(initialPrice, 0.0004);
    priceSimulatorRef.current = simulator;
    
    // Generate realistic historical data (last 100 candles)
    const now = Math.floor(Date.now() / 1000);
    const timeframeSeconds = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : 60;
    const historicalCandles: CandlestickData<Time>[] = [];
    const historicalVolumes: { time: Time; value: number; color: string }[] = [];
    
    // Start from 100 periods ago
    let tempPrice = initialPrice * (1 + (Math.random() - 0.5) * 0.05); // Start with some variance
    const tempSimulator = new PriceSimulator(tempPrice, 0.0005);
    
    for (let i = 100; i >= 1; i--) {
      const candleTime = now - (i * timeframeSeconds);
      const candle = tempSimulator.generateCandle(timeframeSeconds * 1000);
      
      historicalCandles.push({
        time: candleTime as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });
      
      historicalVolumes.push({
        time: candleTime as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      });
    }
    
    // Set data to chart
    candlestickSeries.setData(historicalCandles);
    volumeSeries.setData(historicalVolumes);
    
    // Store data refs
    candleDataRef.current = historicalCandles;
    volumeDataRef.current = historicalVolumes;
    
    // Set current candle and ticker from last historical
    const lastCandle = historicalCandles[historicalCandles.length - 1];
    if (lastCandle) {
      setCurrentCandle(lastCandle);
      simulator.setPrice(lastCandle.close);
      
      setTicker(prev => ({
        ...prev,
        lastPrice: lastCandle.close,
        high24h: Math.max(...historicalCandles.slice(-24).map(c => c.high)),
        low24h: Math.min(...historicalCandles.slice(-24).map(c => c.low)),
        volume24h: historicalVolumes.slice(-24).reduce((acc, v) => acc + v.value, 0),
        quoteVolume24h: historicalVolumes.slice(-24).reduce((acc, v, i) => 
          acc + v.value * historicalCandles[historicalCandles.length - 24 + i]?.close || 0, 0),
      }));
      
      setPrice(lastCandle.close.toFixed(2));
      prevPriceRef.current = lastCandle.close;
    }
    
    // Auto-scroll to show latest data
    chart.timeScale().scrollToPosition(2, false);

    // Auto-resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isOpen, timeframe]);

  // Finnhub WebSocket connection for real-time trades
  useEffect(() => {
    if (!isOpen) return;

    const ws = new WebSocket(FINNHUB_WS_URL);
    wsRef.current = ws;
    
    let tradeIdCounter = 0;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Finnhub WebSocket connected');
      
      // Subscribe to trades
      ws.send(JSON.stringify({ type: 'subscribe', symbol: SYMBOL }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'trade' && message.data) {
        // Process each trade in the batch
        message.data.forEach((trade: { p: number; v: number; t: number; s: string }) => {
          const newPrice = trade.p;
          const tradeQty = trade.v;
          const tradeTime = trade.t;
          
          // Flash effect
          if (prevPriceRef.current !== 0 && newPrice !== prevPriceRef.current) {
            setPriceFlash(newPrice > prevPriceRef.current ? 'up' : 'down');
            setTimeout(() => setPriceFlash(null), 150);
          }
          
          // Update ticker with latest price
          setTicker(prev => {
            const priceChange = newPrice - (prev.lastPrice || newPrice);
            const priceChangePercent = prev.lastPrice ? ((newPrice - prev.lastPrice) / prev.lastPrice) * 100 : 0;
            return {
              ...prev,
              lastPrice: newPrice,
              priceChange: prev.priceChange || priceChange,
              priceChangePercent: prev.priceChangePercent || priceChangePercent,
              high24h: Math.max(prev.high24h || newPrice, newPrice),
              low24h: prev.low24h ? Math.min(prev.low24h, newPrice) : newPrice,
              volume24h: prev.volume24h + tradeQty,
              quoteVolume24h: prev.quoteVolume24h + (tradeQty * newPrice),
            };
          });
          
          prevPriceRef.current = newPrice;
          
          // Update price input if empty
          if (!price) {
            setPrice(newPrice.toFixed(2));
          }
          
          // Add to recent trades
          const isBuy = Math.random() > 0.5; // Finnhub doesn't provide buy/sell direction for crypto
          setRecentTrades(prev => [{
            id: tradeIdCounter++,
            price: newPrice,
            qty: tradeQty,
            time: tradeTime,
            isBuyerMaker: !isBuy,
          }, ...prev.slice(0, 19)]);
          
          // Update current candle in real-time
          setCurrentCandle(prev => {
            if (!prev) return null;
            const currentTime = Math.floor(tradeTime / 1000);
            const candleTime = prev.time as number;
            
            // Check if still in same candle period (1 min = 60s)
            if (currentTime - candleTime < 60) {
              const updatedCandle: CandlestickData<Time> = {
                time: prev.time,
                open: prev.open,
                high: Math.max(prev.high as number, newPrice),
                low: Math.min(prev.low as number, newPrice),
                close: newPrice,
              };
              
              if (candlestickSeriesRef.current) {
                candlestickSeriesRef.current.update(updatedCandle);
              }
              
              return updatedCandle;
            }
            
            // New candle
            const newCandle: CandlestickData<Time> = {
              time: currentTime as Time,
              open: newPrice,
              high: newPrice,
              low: newPrice,
              close: newPrice,
            };
            
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.update(newCandle);
            }
            
            return newCandle;
          });
        });
      }
    };

    ws.onerror = (error) => {
      console.error('Finnhub WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Finnhub WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        // Unsubscribe before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol: SYMBOL }));
        }
        wsRef.current.close();
      }
    };
  }, [isOpen, price]);

  // Advanced real-time price simulation using PriceSimulator
  useEffect(() => {
    if (!isOpen || !priceSimulatorRef.current) return;
    
    let tickCounter = 0;
    let currentVolume = 0;
    
    const simulateRealTimeMovement = () => {
      const simulator = priceSimulatorRef.current;
      if (!simulator) return;
      
      // Get new price from simulator
      const newPrice = simulator.tick();
      tickCounter++;
      
      // Accumulate volume for current candle
      const tradeQty = Math.random() * 0.5 + 0.01;
      currentVolume += tradeQty;
      
      // Update ticker with new price
      setTicker(prev => {
        const priceChange = newPrice - prevPriceRef.current;
        const priceChangePercent = prevPriceRef.current > 0 
          ? ((newPrice - prevPriceRef.current) / prevPriceRef.current) * 100 
          : 0;
        
        return {
          ...prev,
          lastPrice: newPrice,
          priceChange,
          priceChangePercent,
          high24h: Math.max(prev.high24h || newPrice, newPrice),
          low24h: prev.low24h ? Math.min(prev.low24h, newPrice) : newPrice,
          volume24h: prev.volume24h + tradeQty,
          quoteVolume24h: prev.quoteVolume24h + (tradeQty * newPrice),
        };
      });
      
      // Flash effect based on price direction
      if (prevPriceRef.current !== 0) {
        const direction = newPrice > prevPriceRef.current ? 'up' : newPrice < prevPriceRef.current ? 'down' : null;
        if (direction) {
          setPriceFlash(direction);
          setTimeout(() => setPriceFlash(null), 100);
        }
      }
      
      // Update current candle in real-time
      setCurrentCandle(prev => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeframeSeconds = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : 60;
        
        if (!prev) {
          // Create initial candle
          const candleTime = Math.floor(currentTime / timeframeSeconds) * timeframeSeconds;
          const newCandle: CandlestickData<Time> = {
            time: candleTime as Time,
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
          };
          
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.update(newCandle);
          }
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: candleTime as Time,
              value: currentVolume,
              color: 'rgba(38, 166, 154, 0.5)',
            });
          }
          
          return newCandle;
        }
        
        const candleTime = prev.time as number;
        const candleEndTime = candleTime + timeframeSeconds;
        
        // Check if still within current candle period
        if (currentTime < candleEndTime) {
          // Update existing candle
          const updatedCandle: CandlestickData<Time> = {
            time: prev.time,
            open: prev.open,
            high: Math.max(prev.high as number, newPrice),
            low: Math.min(prev.low as number, newPrice),
            close: newPrice,
          };
          
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.update(updatedCandle);
          }
          
          // Update volume bar
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: prev.time,
              value: currentVolume,
              color: updatedCandle.close >= updatedCandle.open 
                ? 'rgba(38, 166, 154, 0.5)' 
                : 'rgba(239, 83, 80, 0.5)',
            });
          }
          
          // Update price line
          if (priceLineSeriesRef.current) {
            priceLineSeriesRef.current.update({
              time: currentTime as Time,
              value: newPrice,
            });
          }
          
          return updatedCandle;
        }
        
        // Create new candle - period elapsed
        const newCandleTime = Math.floor(currentTime / timeframeSeconds) * timeframeSeconds;
        currentVolume = tradeQty; // Reset volume for new candle
        
        const newCandle: CandlestickData<Time> = {
          time: newCandleTime as Time,
          open: prev.close,
          high: Math.max(prev.close, newPrice),
          low: Math.min(prev.close, newPrice),
          close: newPrice,
        };
        
        if (candlestickSeriesRef.current) {
          candlestickSeriesRef.current.update(newCandle);
        }
        
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: newCandleTime as Time,
            value: currentVolume,
            color: newCandle.close >= newCandle.open 
              ? 'rgba(38, 166, 154, 0.5)' 
              : 'rgba(239, 83, 80, 0.5)',
          });
        }
        
        // Auto-scroll to show new candle
        if (chartRef.current) {
          chartRef.current.timeScale().scrollToPosition(2, false);
        }
        
        return newCandle;
      });
      
      // Add to recent trades (every 2-3 ticks)
      if (tickCounter % (2 + Math.floor(Math.random() * 2)) === 0) {
        setRecentTrades(prev => [{
          id: Date.now() + Math.random(),
          price: newPrice,
          qty: tradeQty,
          time: Date.now(),
          isBuyerMaker: newPrice < prevPriceRef.current,
        }, ...prev.slice(0, 24)]);
      }
      
      prevPriceRef.current = newPrice;
    };
    
    // Run simulation every 150ms for smoother movement
    const interval = setInterval(simulateRealTimeMovement, 150);
    
    // Initial tick
    simulateRealTimeMovement();
    
    return () => clearInterval(interval);
  }, [isOpen, timeframe]);

  // Generate simulated order book based on current price
  useEffect(() => {
    if (ticker.lastPrice <= 0) return;
    
    const generateOrderBook = () => {
      const basePrice = ticker.lastPrice;
      const spread = basePrice * 0.0001; // 0.01% spread
      
      const newBids: OrderBookEntry[] = Array.from({ length: 12 }, (_, i) => {
        const price = basePrice - spread - (i * spread * 2);
        const size = Math.random() * 5 + 0.1;
        return {
          price,
          size,
          total: 0,
        };
      });
      
      // Calculate cumulative totals
      newBids.forEach((bid, i) => {
        bid.total = newBids.slice(0, i + 1).reduce((acc, b) => acc + b.size, 0);
      });
      
      const newAsks: OrderBookEntry[] = Array.from({ length: 12 }, (_, i) => {
        const price = basePrice + spread + (i * spread * 2);
        const size = Math.random() * 5 + 0.1;
        return {
          price,
          size,
          total: 0,
        };
      });
      
      // Calculate cumulative totals
      newAsks.forEach((ask, i) => {
        ask.total = newAsks.slice(0, i + 1).reduce((acc, a) => acc + a.size, 0);
      });
      
      setBids(newBids);
      setAsks(newAsks.reverse());
    };
    
    generateOrderBook();
    const interval = setInterval(generateOrderBook, 500); // Update every 500ms
    
    return () => clearInterval(interval);
  }, [ticker.lastPrice]);

  // Format large numbers
  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  // Calculate max total for depth visualization
  const maxBidTotal = Math.max(...bids.map(b => b.total), 1);
  const maxAskTotal = Math.max(...asks.map(a => a.total), 1);

  // Price direction indicator
  const isPriceUp = ticker.priceChange >= 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yellow Professional DEX" 
      className="max-w-[95vw] p-0 bg-transparent border-0 shadow-none"
    >
      <div className="flex h-[85vh] w-[95vw] max-w-[1600px] bg-[#0b0e11] text-gray-300 font-sans text-sm overflow-hidden rounded-xl border border-[#333] shadow-2xl">
        
        {/* LEFT COLUMN: Charts */}
        <div className="flex-1 flex flex-col border-r border-[#333]">
            {/* Ticker Header */}
            <div className="h-16 border-b border-[#333] flex items-center justify-between px-4 bg-[#15171e]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-lg">ETH</div>
                        <div className="h-9 w-9 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center font-bold text-white text-xs -ml-4 border-2 border-[#15171e] shadow-lg">USDT</div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            ETH / USDT 
                            <span className="bg-[#333] text-xs px-2 py-0.5 rounded text-gray-400">Perp</span>
                            {isConnected ? (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <Wifi size={12} /> Live
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <WifiOff size={12} /> Offline
                              </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-mono font-bold flex items-center gap-1 transition-all duration-150 ${
                            priceFlash === 'up' ? 'text-green-400 scale-105' : 
                            priceFlash === 'down' ? 'text-red-400 scale-105' : 
                            isPriceUp ? 'text-green-400' : 'text-red-400'
                          }`}>
                              ${ticker.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {isPriceUp ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                          </span>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isPriceUp ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {isPriceUp ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                          </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-5 text-xs text-gray-400">
                    <div>
                        <div className="text-gray-500 text-[10px] uppercase">24h High</div>
                        <div className="text-green-400 font-mono">${ticker.high24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-[10px] uppercase">24h Low</div>
                        <div className="text-red-400 font-mono">${ticker.low24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-[10px] uppercase">24h Volume (ETH)</div>
                        <div className="text-white font-mono">{ticker.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-[10px] uppercase">24h Volume (USDT)</div>
                        <div className="text-white font-mono">{formatVolume(ticker.quoteVolume24h)}</div>
                    </div>
                </div>
            </div>

            {/* Timeframe Selector */}
            <div className="h-10 border-b border-[#333] flex items-center px-4 gap-1 bg-[#0d1117]">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    timeframe === tf 
                      ? 'bg-yellow-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-[#333]'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-500">
                <Volume2 size={12} />
                Finnhub Real-time Feed
              </div>
            </div>

            {/* Chart Area - TradingView Lightweight Charts */}
            <div className="flex-1 bg-[#0b0e11] relative border-b border-[#333]">
                <div ref={chartContainerRef} className="absolute inset-0" />
                
                {/* Current Candle Info Overlay */}
                {currentCandle && (
                  <div className="absolute top-2 left-2 bg-[#15171e]/90 backdrop-blur-sm px-3 py-2 rounded text-xs font-mono z-10 border border-[#333]">
                    <div className="flex gap-4">
                      <span className="text-gray-400">O: <span className="text-white">{(currentCandle.open as number).toFixed(2)}</span></span>
                      <span className="text-gray-400">H: <span className="text-green-400">{(currentCandle.high as number).toFixed(2)}</span></span>
                      <span className="text-gray-400">L: <span className="text-red-400">{(currentCandle.low as number).toFixed(2)}</span></span>
                      <span className="text-gray-400">C: <span className={currentCandle.close >= currentCandle.open ? 'text-green-400' : 'text-red-400'}>{(currentCandle.close as number).toFixed(2)}</span></span>
                    </div>
                  </div>
                )}
            </div>

            {/* Bottom Panel: Recent Trades */}
            <div className="h-48 bg-[#15171e] flex flex-col">
                <div className="flex border-b border-[#333]">
                    <button className="px-6 py-2.5 text-xs font-bold text-yellow-500 border-b-2 border-yellow-500 bg-[#333]/20">
                      <Activity size={12} className="inline mr-1" /> Market Trades
                    </button>
                    <button className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-300">Positions (0)</button>
                    <button className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-300">Open Orders</button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-3 px-4 py-1 text-[10px] text-gray-500 uppercase border-b border-[#333]/50">
                    <span>Price (USDT)</span>
                    <span className="text-right">Amount (ETH)</span>
                    <span className="text-right">Time</span>
                  </div>
                  <div className="overflow-y-auto h-32 custom-scrollbar">
                    {recentTrades.length > 0 ? (
                      recentTrades.map((trade) => (
                        <div 
                          key={trade.id} 
                          className={`grid grid-cols-3 px-4 py-0.5 text-xs font-mono hover:bg-[#333]/20 transition-colors ${
                            trade.isBuyerMaker ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {trade.isBuyerMaker ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                            {trade.price.toFixed(2)}
                          </span>
                          <span className="text-right text-gray-300">{trade.qty.toFixed(4)}</span>
                          <span className="text-right text-gray-500">
                            {new Date(trade.time).toLocaleTimeString('en-US', { hour12: false })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        Waiting for trades...
                      </div>
                    )}
                  </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Orderbook & Execution */}
        <div className="w-[340px] bg-[#15171e] flex flex-col">
            
            {/* Order Book */}
            <div className="flex-1 border-b border-[#333] flex flex-col">
                <div className="p-3 border-b border-[#333] text-gray-400 text-[10px] font-bold uppercase flex justify-between">
                    <span>Price (USDT)</span>
                    <span>Size (ETH)</span>
                    <span>Total</span>
                </div>
                <div className="flex-1 overflow-hidden font-mono text-xs">
                    {/* Asks (Sell Orders) */}
                    <div className="flex flex-col-reverse h-[45%] justify-end">
                         {asks.map((ask, i) => (
                             <div key={i} className="flex justify-between px-3 py-0.5 hover:bg-[#333]/50 cursor-pointer text-red-400 relative group">
                                 <span className="z-10 font-medium">{ask.price.toFixed(2)}</span>
                                 <span className="z-10 text-gray-400">{ask.size.toFixed(4)}</span>
                                 <span className="z-10 text-gray-500">{ask.total.toFixed(4)}</span>
                                 <div 
                                   className="absolute right-0 top-0 bottom-0 bg-red-500/10 group-hover:bg-red-500/20 transition-all" 
                                   style={{ width: `${(ask.total / maxAskTotal) * 100}%`}}
                                 />
                             </div>
                         ))}
                    </div>
                    
                    {/* Spread Info */}
                    <div className={`py-2 text-center border-y border-[#333] text-lg font-bold bg-[#0b0e11] flex items-center justify-center gap-2 transition-all duration-150 ${
                      priceFlash === 'up' ? 'text-green-400 bg-green-900/10' : 
                      priceFlash === 'down' ? 'text-red-400 bg-red-900/10' : 
                      isPriceUp ? 'text-green-400' : 'text-red-400'
                    }`}>
                        <span className="font-mono">{ticker.lastPrice.toFixed(2)}</span>
                        {isPriceUp ? <ArrowUpRight size={18} className="animate-bounce"/> : <ArrowDownRight size={18} className="animate-bounce"/>}
                        <span className="text-xs text-gray-500 font-normal">${ticker.lastPrice.toFixed(2)}</span>
                    </div>

                    {/* Bids (Buy Orders) */}
                    <div className="flex flex-col h-[45%]">
                         {bids.map((bid, i) => (
                             <div key={i} className="flex justify-between px-3 py-0.5 hover:bg-[#333]/50 cursor-pointer text-green-400 relative group">
                                 <span className="z-10 font-medium">{bid.price.toFixed(2)}</span>
                                 <span className="z-10 text-gray-400">{bid.size.toFixed(4)}</span>
                                 <span className="z-10 text-gray-500">{bid.total.toFixed(4)}</span>
                                 <div 
                                   className="absolute right-0 top-0 bottom-0 bg-green-500/10 group-hover:bg-green-500/20 transition-all" 
                                   style={{ width: `${(bid.total / maxBidTotal) * 100}%`}}
                                 />
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Execution Panel using Session Balance */}
            <div className="p-4 bg-[#1e2329]">
                <div className="flex bg-[#2a2d35] p-1 rounded-lg mb-4">
                    <button 
                        onClick={() => setOrderType('LIMIT')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${orderType === 'LIMIT' ? 'bg-[#363a45] text-white shadow' : 'text-gray-500'}`}
                    >
                        Limit
                    </button>
                    <button 
                        onClick={() => setOrderType('MARKET')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${orderType === 'MARKET' ? 'bg-[#363a45] text-white shadow' : 'text-gray-500'}`}
                    >
                        Market
                    </button>
                    <button className="flex-1 text-xs font-bold py-1.5 rounded-md text-gray-500">Stop</button>
                </div>

                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={() => setSide('BUY')}
                        className={`flex-1 py-2.5 font-bold text-sm rounded transition-all ${side === 'BUY' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-[#2a2d35] text-gray-400 hover:bg-[#333]'}`}
                    >
                        Buy / Long
                    </button>
                    <button 
                        onClick={() => setSide('SELL')}
                        className={`flex-1 py-2.5 font-bold text-sm rounded transition-all ${side === 'SELL' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#2a2d35] text-gray-400 hover:bg-[#333]'}`}
                    >
                        Sell / Short
                    </button>
                </div>

                <div className="space-y-3 mb-4">
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Price (USDT)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder={ticker.lastPrice.toFixed(2)}
                                className="w-full bg-[#15171e] border border-[#333] rounded p-2.5 text-right text-sm text-white font-mono focus:border-yellow-500 outline-none transition-all"
                            />
                            <button 
                              onClick={() => setPrice(ticker.lastPrice.toFixed(2))}
                              className="absolute left-2 top-2 text-[10px] text-yellow-500 hover:text-yellow-400 font-bold"
                            >
                              LAST
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Amount (ETH)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#15171e] border border-[#333] rounded p-2.5 text-right text-sm text-white font-mono focus:border-yellow-500 outline-none transition-all"
                            />
                            <span className="absolute left-2 top-2.5 text-xs text-gray-500">ETH</span>
                        </div>
                        {/* Quick amount buttons */}
                        <div className="flex gap-1 mt-1">
                          {[25, 50, 75, 100].map((pct) => (
                            <button
                              key={pct}
                              onClick={() => {
                                const maxEth = balance / (parseFloat(price) || ticker.lastPrice);
                                setAmount((maxEth * pct / 100).toFixed(4));
                              }}
                              className="flex-1 text-[10px] py-1 bg-[#2a2d35] text-gray-400 hover:text-white hover:bg-[#333] rounded transition-all"
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-xs pt-2 border-t border-[#333]">
                        <span className="text-gray-500">Available Balance</span>
                        <span className="text-white font-mono">{balance.toFixed(4)} USDT</span>
                    </div>

                    <div className="bg-[#2a2d35] rounded p-2.5">
                         <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                             <span>Leverage</span>
                             <span className="text-yellow-500 font-bold">20x</span>
                         </div>
                         <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 w-[20%] transition-all"></div>
                         </div>
                    </div>
                    
                    {/* Order Summary */}
                    {amount && price && (
                      <div className="bg-[#0b0e11] rounded p-2 text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Order Value</span>
                          <span className="text-white font-mono">{(parseFloat(amount) * parseFloat(price)).toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Est. Fee (0.04%)</span>
                          <span className="text-gray-400 font-mono">{(parseFloat(amount) * parseFloat(price) * 0.0004).toFixed(4)} USDT</span>
                        </div>
                      </div>
                    )}
                </div>

                <button className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all active:scale-95 ${
                  side === 'BUY' 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-600/30' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-600/30'
                }`}>
                    {side === 'BUY' ? '🚀 Buy / Long ETH' : '📉 Sell / Short ETH'}
                </button>
            </div>

        </div>
      </div>
    </Modal>
  );
}
