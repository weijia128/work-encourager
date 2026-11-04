export interface ShopItem {
  readonly name: string;
  readonly price: number;
  readonly emoji: string;
}

export const ITEMS: readonly ShopItem[] = [
  { name: "一杯瑞幸", price: 15, emoji: "☕" },
  { name: "一杯奶茶", price: 18, emoji: "🧋" },
  { name: "一份早餐", price: 20, emoji: "🥪" },
  { name: "一份外卖", price: 30, emoji: "🍱" },
  { name: "一杯果茶", price: 32, emoji: "🍹" },
  { name: "一张电影票", price: 45, emoji: "🎬" },
  { name: "一顿火锅", price: 88, emoji: "🍲" },
  { name: "一件 T 恤", price: 99, emoji: "👕" },
  { name: "一顿烤肉", price: 128, emoji: "🥩" },
  { name: "一套护肤品", price: 159, emoji: "🧴" },
  { name: "一双运动鞋", price: 299, emoji: "👟" },
  { name: "一副羽毛球拍", price: 399, emoji: "🏸" },
  { name: "一台空气炸锅", price: 499, emoji: "🍳" },
  { name: "一件卫衣", price: 599, emoji: "🧥" },
  { name: "一次短途旅行", price: 800, emoji: "🧳" },
  { name: "一副降噪耳机", price: 1299, emoji: "🎧" },
  { name: "一台平板电脑", price: 1999, emoji: "📱" },
  { name: "一台扫地机器人", price: 2499, emoji: "🤖" },
  { name: "一台游戏主机", price: 3999, emoji: "🎮" },
  { name: "一台相机", price: 3999, emoji: "📷" },
  { name: "一趟长途旅行", price: 5000, emoji: "✈️" },
  { name: "一台笔记本电脑", price: 5999, emoji: "💻" },
  { name: "一辆自行车", price: 6999, emoji: "🚲" },
  { name: "一台电动滑板车", price: 8999, emoji: "🛴" },
  { name: "一次海外旅行", price: 12000, emoji: "🌏" },
];
