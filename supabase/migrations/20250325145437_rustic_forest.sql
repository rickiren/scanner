/*
  # Add Test News Data

  1. Changes
    - Add sample news alerts for testing
    - Include a mix of positive, negative, and neutral sentiment
    - Use realistic timestamps and relevance scores
*/

-- Insert test news alerts
INSERT INTO news_alerts (
  coin_id,
  symbol,
  name,
  news_id,
  title,
  url,
  sentiment,
  relevance_score,
  alert_time
) VALUES
  -- Positive news
  (
    'bitcoin',
    'btc',
    'Bitcoin',
    'news_btc_1',
    'Bitcoin ETF Approval Drives Institutional Adoption',
    'https://www.coingecko.com/news/bitcoin-etf-approval',
    'positive',
    0.95,
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'ethereum',
    'eth',
    'Ethereum',
    'news_eth_1',
    'Ethereum Layer 2 Solutions See Record Growth in TVL',
    'https://www.coingecko.com/news/ethereum-l2-growth',
    'positive',
    0.88,
    NOW() - INTERVAL '15 minutes'
  ),
  (
    'solana',
    'sol',
    'Solana',
    'news_sol_1',
    'Major DeFi Protocol Launches on Solana Network',
    'https://www.coingecko.com/news/solana-defi-launch',
    'positive',
    0.85,
    NOW() - INTERVAL '25 minutes'
  ),

  -- Neutral news
  (
    'cardano',
    'ada',
    'Cardano',
    'news_ada_1',
    'Cardano Foundation Announces Technical Updates',
    'https://www.coingecko.com/news/cardano-updates',
    'neutral',
    0.75,
    NOW() - INTERVAL '35 minutes'
  ),
  (
    'polkadot',
    'dot',
    'Polkadot',
    'news_dot_1',
    'New Parachain Auction Schedule Released for Polkadot',
    'https://www.coingecko.com/news/polkadot-auctions',
    'neutral',
    0.82,
    NOW() - INTERVAL '45 minutes'
  ),

  -- Negative news
  (
    'avalanche',
    'avax',
    'Avalanche',
    'news_avax_1',
    'Technical Issues Cause Brief Network Delay on Avalanche',
    'https://www.coingecko.com/news/avalanche-network-delay',
    'negative',
    0.78,
    NOW() - INTERVAL '55 minutes'
  ),
  (
    'chainlink',
    'link',
    'Chainlink',
    'news_link_1',
    'Market Volatility Impacts Oracle Network Fees',
    'https://www.coingecko.com/news/chainlink-fees',
    'negative',
    0.72,
    NOW() - INTERVAL '65 minutes'
  );