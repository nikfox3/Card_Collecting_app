#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

class PricingIntegrityReport {
  constructor() {
    this.report = {
      totalCards: 0,
      cardsWithPrices: 0,
      priceDistribution: {},
      suspiciousData: [],
      recentUpdates: [],
      dataQuality: {}
    };
  }

  async generateReport() {
    console.log('📊 POKEMON CARD PRICING INTEGRITY REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Generated: ${new Date().toLocaleString()}\n`);

    await this.analyzeCardCounts();
    await this.analyzePriceDistribution();
    await this.analyzeSuspiciousData();
    await this.analyzeRecentUpdates();
    await this.analyzeDataQuality();
    await this.generateRecommendations();
  }

  async analyzeCardCounts() {
    const stats = await get(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN current_value > 0 THEN 1 END) as cards_with_prices,
        COUNT(CASE WHEN current_value = 0 THEN 1 END) as cards_without_prices,
        AVG(current_value) as avg_price,
        MIN(current_value) as min_price,
        MAX(current_value) as max_price
      FROM cards
    `);

    this.report.totalCards = stats.total_cards;
    this.report.cardsWithPrices = stats.cards_with_prices;

    console.log('📈 CARD COUNT ANALYSIS');
    console.log('-'.repeat(30));
    console.log(`Total cards in database: ${stats.total_cards.toLocaleString()}`);
    console.log(`Cards with prices: ${stats.cards_with_prices.toLocaleString()} (${((stats.cards_with_prices / stats.total_cards) * 100).toFixed(1)}%)`);
    console.log(`Cards without prices: ${stats.cards_without_prices.toLocaleString()} (${((stats.cards_without_prices / stats.total_cards) * 100).toFixed(1)}%)`);
    console.log(`Average price: $${stats.avg_price.toFixed(2)}`);
    console.log(`Price range: $${stats.min_price.toFixed(2)} - $${stats.max_price.toFixed(2)}\n`);
  }

  async analyzePriceDistribution() {
    const distribution = await all(`
      SELECT 
        CASE 
          WHEN current_value >= 10000 THEN '10k+'
          WHEN current_value >= 1000 THEN '1k-10k'
          WHEN current_value >= 100 THEN '100-1k'
          WHEN current_value >= 10 THEN '10-100'
          WHEN current_value >= 1 THEN '1-10'
          WHEN current_value > 0 THEN '0-1'
          ELSE 'No Price'
        END as price_range,
        COUNT(*) as count,
        AVG(current_value) as avg_price
      FROM cards
      GROUP BY price_range
      ORDER BY 
        CASE 
          WHEN current_value >= 10000 THEN 1
          WHEN current_value >= 1000 THEN 2
          WHEN current_value >= 100 THEN 3
          WHEN current_value >= 10 THEN 4
          WHEN current_value >= 1 THEN 5
          WHEN current_value > 0 THEN 6
          ELSE 7
        END
    `);

    this.report.priceDistribution = distribution;

    console.log('💰 PRICE DISTRIBUTION');
    console.log('-'.repeat(30));
    distribution.forEach(range => {
      const percentage = ((range.count / this.report.totalCards) * 100).toFixed(1);
      const avgPrice = range.avg_price ? `$${range.avg_price.toFixed(2)}` : 'N/A';
      console.log(`${range.price_range.padEnd(10)}: ${range.count.toLocaleString().padStart(6)} cards (${percentage.padStart(5)}%) - Avg: ${avgPrice}`);
    });
    console.log('');
  }

  async analyzeSuspiciousData() {
    const suspicious = await all(`
      SELECT c.id, c.name, c.current_value, c.rarity, s.name as set_name
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      WHERE c.current_value > 0 AND (
        c.current_value > 10000 OR
        c.current_value % 1000 = 0 OR
        (c.current_value > 100 AND CAST(c.current_value AS TEXT) LIKE '%.99')
      )
      ORDER BY c.current_value DESC
      LIMIT 20
    `);

    this.report.suspiciousData = suspicious;

    if (suspicious.length > 0) {
      console.log('🚨 SUSPICIOUS PRICING DATA');
      console.log('-'.repeat(30));
      suspicious.forEach((card, index) => {
        const issues = [];
        if (card.current_value > 10000) issues.push('Very high price');
        if (card.current_value % 1000 === 0) issues.push('Round number');
        if (card.current_value > 100 && card.current_value.toString().endsWith('.99')) {
          issues.push('Retail pricing');
        }
        
        console.log(`${index + 1}. ${card.name} (${card.set_name})`);
        console.log(`   Price: $${card.current_value} | Issues: ${issues.join(', ')}`);
      });
      console.log('');
    }
  }

  async analyzeRecentUpdates() {
    const recent = await all(`
      SELECT 
        COUNT(*) as total_updates,
        COUNT(DISTINCT product_id) as unique_cards,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM price_history
      WHERE date >= '2025-10-13'
    `);

    this.report.recentUpdates = recent[0];

    console.log('📅 RECENT PRICE UPDATES');
    console.log('-'.repeat(30));
    console.log(`Total price history records: ${recent[0].total_updates.toLocaleString()}`);
    console.log(`Unique cards with history: ${recent[0].unique_cards.toLocaleString()}`);
    console.log(`Date range: ${recent[0].earliest_date} to ${recent[0].latest_date}\n`);
  }

  async analyzeDataQuality() {
    // Check for missing data
    const missingData = await all(`
      SELECT 
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names,
        COUNT(CASE WHEN rarity IS NULL OR rarity = '' THEN 1 END) as missing_rarity,
        COUNT(CASE WHEN set_id IS NULL THEN 1 END) as missing_set
      FROM cards
    `);

    this.report.dataQuality = missingData[0];

    console.log('🔍 DATA QUALITY ANALYSIS');
    console.log('-'.repeat(30));
    console.log(`Missing card names: ${missingData[0].missing_names}`);
    console.log(`Missing rarity data: ${missingData[0].missing_rarity}`);
    console.log(`Missing set associations: ${missingData[0].missing_set}\n`);
  }

  async generateRecommendations() {
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(30));
    
    const priceCoverage = (this.report.cardsWithPrices / this.report.totalCards) * 100;
    
    if (priceCoverage < 90) {
      console.log('⚠️  Price coverage is below 90%. Consider:');
      console.log('   • Running price collection for missing cards');
      console.log('   • Checking data sources for completeness');
    }
    
    if (this.report.suspiciousData.length > 0) {
      console.log('🚨 Suspicious pricing data detected. Consider:');
      console.log('   • Running price validation script');
      console.log('   • Manual review of high-value cards');
      console.log('   • Implementing stricter validation rules');
    }
    
    console.log('✅ Best practices:');
    console.log('   • Run daily price updates with validation');
    console.log('   • Monitor for unrealistic price changes');
    console.log('   • Keep price history for trend analysis');
    console.log('   • Regular data quality audits');
    
    console.log('\n🎯 NEXT STEPS');
    console.log('-'.repeat(30));
    console.log('1. Run: node validate-pricing-data.js (if suspicious data found)');
    console.log('2. Run: node update-prices-with-validation.js (for fresh data)');
    console.log('3. Set up automated daily price collection');
    console.log('4. Monitor price change alerts for anomalies');
  }
}

// Run the report
const report = new PricingIntegrityReport();
report.generateReport()
  .then(() => {
    console.log('\n✅ Pricing integrity report complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  });







