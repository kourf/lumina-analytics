import { WebcastPushConnection } from 'tiktok-live-connector';

const c1 = new WebcastPushConnection('@karam.drame');
const c2 = new WebcastPushConnection('karam.drame');

console.log('c1 uniqueId:', c1.uniqueId);
console.log('c2 uniqueId:', c2.uniqueId);
