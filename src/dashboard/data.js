export const holdings = [
  { name: 'Bitcoin', sym: 'BTC', amt: '2.14 BTC', price: '$67,420', chg: 3.2, val: '$144,279', pct: '45.0%', color: '#f59e0b', staked: false, spark: [4, 5, 4, 6, 5, 7, 6, 8, 7, 9] },
  { name: 'Ethereum', sym: 'ETH', amt: '24.8 ETH', price: '$3,648', chg: 1.8, val: '$90,470', pct: '28.2%', color: '#6366f1', staked: true, spark: [5, 5, 6, 5, 7, 6, 7, 7, 8, 8] },
  { name: 'USDC Yield', sym: 'USDC', amt: '42,500 USDC', price: '$1.00', chg: 0.0, val: '$42,500', pct: '13.2%', color: '#2563eb', staked: true, spark: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7] },
  { name: 'USDT Reserve', sym: 'USDT', amt: '28,750 USDT', price: '$1.00', chg: 0.0, val: '$28,750', pct: '9.0%', color: '#16a34a', staked: false, spark: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7] },
  { name: 'ETH Staking', sym: 'stETH', amt: '3.62 stETH', price: '$3,610', chg: 1.5, val: '$13,069', pct: '4.1%', color: '#a855f7', staked: true, spark: [5, 6, 5, 6, 7, 6, 7, 7, 8, 8] },
  { name: 'Cash Reserve', sym: 'USD', amt: '$3,682', price: '$1.00', chg: 0.0, val: '$3,682', pct: '1.1%', color: '#8b8b97', staked: false, spark: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7] },
]

export const txns = [
  { type: 'yield', label: 'ETH Staking Reward', sub: 'stETH · validator pool', amt: '+$312.40', when: 'Today, 09:14', sign: 1 },
  { type: 'rebalance', label: 'Portfolio Rebalanced', sub: 'Growth Strategy · Q2 review', amt: 'Allocation adjusted', when: 'Yesterday, 14:30', sign: 0 },
  { type: 'deposit', label: 'Capital Deposit', sub: 'Bank transfer ····4821', amt: '+$25,000.00', when: 'Jun 18, 11:30', sign: 1 },
  { type: 'yield', label: 'USDC Lending Yield', sub: 'Balanced Strategy · lending pool', amt: '+$196.40', when: 'Jun 17, 09:14', sign: 1 },
  { type: 'alloc', label: 'Portfolio Allocation', sub: 'Bitcoin — Growth Strategy', amt: '$12,500 deployed', when: 'Jun 14, 13:45', sign: 0 },
  { type: 'deposit', label: 'Capital Deposit', sub: 'Bank transfer ····4821', amt: '+$50,000.00', when: 'Jun 10, 08:20', sign: 1 },
  { type: 'yield', label: 'ETH Staking Reward', sub: 'stETH · validator pool', amt: '+$298.10', when: 'Jun 10, 09:14', sign: 1 },
  { type: 'report', label: 'Q2 Report Published', sub: 'Quarterly Investment Review · PDF ready', amt: 'Download', when: 'Jun 1, 10:00', sign: 1 },
  { type: 'withdraw', label: 'Withdrawal Processed', sub: 'To bank ····4821', amt: '−$5,000.00', when: 'May 28, 15:22', sign: -1 },
  { type: 'yield', label: 'USDC Lending Yield', sub: 'Conservative Strategy · lending pool', amt: '+$184.20', when: 'May 17, 09:14', sign: 1 },
]

export const txIcon = {
  deposit: '#16a34a',
  withdraw: '#ef4444',
  yield: '#f59e0b',
  rebalance: '#7c3aed',
  alloc: '#6366f1',
  report: '#0ea5e9',
}

export const txLabel = {
  deposit: '↓',
  withdraw: '↑',
  yield: '$',
  rebalance: '⟳',
  alloc: '◈',
  report: '↓',
}

export const chg = (c) => {
  const col = c > 0 ? '#16a34a' : c < 0 ? '#ef4444' : '#8d83a6'
  const ar = c > 0 ? '▲' : c < 0 ? '▼' : '—'
  return { col, text: `${ar} ${c > 0 ? '+' : ''}${c !== 0 ? c.toFixed(1) + '%' : '0.0%'}` }
}

export const reports = [
  { title: 'Monthly Performance Report', period: 'June 2026', type: 'Monthly', size: '1.2 MB', date: 'Jun 1, 2026' },
  { title: 'Quarterly Investment Review', period: 'Q1 2026', type: 'Quarterly', size: '3.4 MB', date: 'Apr 1, 2026' },
  { title: 'Monthly Performance Report', period: 'May 2026', type: 'Monthly', size: '1.1 MB', date: 'May 1, 2026' },
  { title: 'Annual Portfolio Statement', period: 'Year 2025', type: 'Annual', size: '5.8 MB', date: 'Jan 15, 2026' },
  { title: 'Capital Gains Summary', period: 'Year 2025', type: 'Tax', size: '2.1 MB', date: 'Feb 1, 2026' },
  { title: 'Monthly Performance Report', period: 'April 2026', type: 'Monthly', size: '1.0 MB', date: 'Apr 2, 2026' },
]

export const insights = [
  {
    date: 'Jun 20, 2026',
    tag: 'Portfolio Update',
    headline: 'Bitcoin allocation increased following improved market conditions',
    body: 'Following a period of consolidation and positive on-chain signals, the investment team has increased Bitcoin exposure within the Growth Strategy from 45% to 52%. This adjustment reflects our conviction in continued long-term adoption.',
  },
  {
    date: 'Jun 12, 2026',
    tag: 'Market Commentary',
    headline: 'Stablecoin allocation raised to reduce short-term volatility',
    body: 'Given elevated near-term uncertainty in global macro conditions, we have increased stablecoin yield positions within the Balanced Strategy. This maintains income generation while reducing portfolio sensitivity to short-term price swings.',
  },
  {
    date: 'Jun 5, 2026',
    tag: 'Strategy Update',
    headline: 'Ethereum staking rewards compounded — Q2 yield ahead of target',
    body: 'Our ETH staking infrastructure delivered 4.2% annualized yield for Q2, ahead of our 4.0% target. All staking rewards have been compounded back into client positions. The Conservative Strategy continues to outperform its capital preservation benchmark.',
  },
  {
    date: 'May 28, 2026',
    tag: 'Portfolio Update',
    headline: 'Portfolio rebalancing completed — Growth Strategy back to target weights',
    body: 'Following Bitcoin\'s appreciation in May, we executed a scheduled rebalancing of the Growth Strategy to restore target allocations. Bitcoin exposure trimmed from 58% to 50%, with proceeds reinvested into Ethereum positions.',
  },
]
