declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module '@antv/data-set';
declare module 'mockjs';
declare module 'react-fittext';
declare module 'bizcharts-plugin-slider';
// src/typings.d.ts
export interface Article {
    id: string;
    title: string;
    date: string;
    categories: string[];
    tags: string[];
    content: string;
}

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;
