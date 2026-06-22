export const holdings = [
  { name: 'DAS-Prime', sym: 'DAS1', amt: '4.12', price: '$58,694', chg: 2.4, val: '$241,820', pct: '45.8%', color: '#7c3aed', staked: false, spark: [3, 5, 4, 6, 5, 7, 6, 8, 7, 9] },
  { name: 'DAS-Yield', sym: 'DAS2', amt: '38.6', price: '$3,327', chg: 1.1, val: '$128,440', pct: '24.3%', color: '#6366f1', staked: false, spark: [5, 5, 6, 5, 7, 6, 7, 7, 8, 8] },
  { name: 'DAS-Growth', sym: 'DAS3', amt: '412', price: '$153.42', chg: 5.8, val: '$63,210', pct: '12.0%', color: '#ec4899', staked: false, spark: [4, 5, 4, 6, 7, 6, 8, 7, 9, 10] },
  { name: 'DAS-Infra', sym: 'DAS4', amt: '16.2', price: '$3,389', chg: 0.4, val: '$54,900', pct: '10.4%', color: '#14b8a6', staked: true, spark: [6, 6, 7, 6, 7, 7, 7, 8, 8, 8] },
  { name: 'DAS-Reserve', sym: 'DAS5', amt: '39,069', price: '$1.00', chg: 0.0, val: '$39,069', pct: '7.4%', color: '#f59e0b', staked: true, spark: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7] },
]

export const txns = [
  { type: 'yield', label: 'Staking reward', sub: 'stETH · validator pool', amt: '+$214.80', when: 'Today, 09:14', sign: 1 },
  { type: 'buy', label: 'Bought Solana', sub: '42 SOL @ $151.20', amt: '−$6,350.40', when: 'Yesterday, 16:02', sign: -1 },
  { type: 'deposit', label: 'Bank deposit', sub: '····4821', amt: '+$25,000.00', when: 'Mar 18, 11:30', sign: 1 },
  { type: 'yield', label: 'Staking reward', sub: 'USDC lending', amt: '+$96.40', when: 'Mar 17, 09:14', sign: 1 },
  { type: 'buy', label: 'Bought Ethereum', sub: '6.2 ETH @ $3,310', amt: '−$20,522.00', when: 'Mar 14, 13:45', sign: -1 },
  { type: 'deposit', label: 'Bank deposit', sub: '····4821', amt: '+$50,000.00', when: 'Mar 10, 08:20', sign: 1 },
  { type: 'yield', label: 'Staking reward', sub: 'stETH · validator pool', amt: '+$208.10', when: 'Mar 10, 09:14', sign: 1 },
  { type: 'buy', label: 'Bought Bitcoin', sub: '0.8 BTC @ $57,400', amt: '−$45,920.00', when: 'Mar 6, 10:08', sign: -1 },
]

export const txIcon = { deposit: '#16a34a', buy: '#7c3aed', yield: '#f59e0b', withdraw: '#ef4444' }

export const chg = (c) => {
  const col = c > 0 ? '#16a34a' : c < 0 ? '#ef4444' : '#8d83a6'
  const ar = c > 0 ? '▲' : c < 0 ? '▼' : '—'
  return { col, text: `${ar} ${c > 0 ? '+' : ''}${c.toFixed(1)}%` }
}
