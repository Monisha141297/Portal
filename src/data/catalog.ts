import type { Category, Product, Topic } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'C1', name: 'General', desc: 'Company-wide induction, safety and quality fundamentals', icon: '◈', cls: 'c2', status: 'Active' },
  { id: 'C2', name: 'Cement', desc: 'Cement product range — composition, process and application', icon: '▣', cls: 'c1', status: 'Active' },
  { id: 'C3', name: 'Hardworker', desc: 'Hardworker brand portfolio — premium construction solutions', icon: '▲', cls: 'c3', status: 'Active' },
];

export const PRODUCTS: Product[] = [
  { id: 'P0', cat: 'C1', name: 'Organisation Essentials', desc: 'Applies to all employees', status: 'Active' },
  { id: 'P1', cat: 'C2', name: 'Supergrade PPC', desc: 'Portland Pozzolana Cement for general construction', status: 'Active' },
  { id: 'P2', cat: 'C2', name: 'Supercrete PSC', desc: 'Portland Slag Cement for aggressive environments', status: 'Active' },
  { id: 'P3', cat: 'C3', name: 'Hardworker OPC 53', desc: 'High strength Ordinary Portland Cement', status: 'Active' },
  { id: 'P4', cat: 'C3', name: 'Hardworker Ready-Mix', desc: 'Factory-produced concrete solutions', status: 'Active' },
];

export const TOPICS: Topic[] = [
  { id: 'T1', prod: 'P1', name: 'Product Overview', desc: 'What Supergrade PPC is, composition and standards', pass: 70, defTime: 30, examCount: 20, status: 'Published' },
  { id: 'T2', prod: 'P1', name: 'Manufacturing Process', desc: 'From limestone to bagged cement', pass: 70, defTime: 30, examCount: 20, status: 'Published' },
  { id: 'T3', prod: 'P1', name: 'Product Applications', desc: 'Where and how Supergrade PPC is used', pass: 75, defTime: 30, examCount: 15, status: 'Published' },
  { id: 'T4', prod: 'P2', name: 'Product Features', desc: 'Slag cement benefits and differentiators', pass: 70, defTime: 30, examCount: 15, status: 'Published' },
  { id: 'T5', prod: 'P3', name: 'Strength & Grade Basics', desc: 'Grade 53 characteristics and testing', pass: 80, defTime: 25, examCount: 15, status: 'Published' },
  { id: 'T6', prod: 'P4', name: 'Ready-Mix Fundamentals', desc: 'RMC ordering, slump and placement', pass: 70, defTime: 30, examCount: 12, status: 'Draft' },
  { id: 'T7', prod: 'P0', name: 'Plant Safety Induction', desc: 'Mandatory safety orientation for all staff', pass: 80, defTime: 25, examCount: 12, status: 'Published' },
];
