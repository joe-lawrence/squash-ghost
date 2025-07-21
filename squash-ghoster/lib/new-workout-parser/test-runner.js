/**
 * Comprehensive test runner for the JavaScript Squash Workout Parser library.
 */

import { DataStructuresTestSuite } from './test-data-structures.js';
import { ConfigTestSuite } from './test-config.js';
import { ValidationTestSuite } from './test-validation.js';
import { TimingTestSuite } from './test-timing.js';
import { ParserTestSuite } from './test-parser.js';

/**
 * Main test runner class.
 */
export class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Data Structures', suite: new DataStructuresTestSuite() },
      { name: 'Configuration', suite: new ConfigTestSuite() },
      { name: 'Validation', suite: new ValidationTestSuite() },
      { name: 'Timing', suite: new TimingTestSuite() },
      { name: 'Parser', suite: new ParserTestSuite() },
    ];
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Runs all test suites.
   */
  async runAllTests() {
    console.log('🚀 Starting JavaScript Squash Workout Parser Tests\n');
    console.log('='.repeat(60));

    this.startTime = Date.now();

    for (const { name, suite } of this.testSuites) {
      console.log(`\n📋 Running ${name} Tests`);
      console.log('-'.repeat(40));

      try {
        suite.runAllTests();
        this.totalPassed += suite.passed;
        this.totalFailed += suite.failed;
      } catch (error) {
        console.log(`❌ Error running ${name} tests: ${error.message}`);
        this.totalFailed++;
      }
    }

    this.endTime = Date.now();
    this.printFinalSummary();
  }

  /**
   * Runs a specific test suite.
   */
  async runTestSuite(suiteName) {
    const testSuite = this.testSuites.find(ts =>
      ts.name.toLowerCase().includes(suiteName.toLowerCase()),
    );

    if (!testSuite) {
      console.log(`❌ Test suite '${suiteName}' not found`);
      console.log('Available suites:', this.testSuites.map(ts => ts.name).join(', '));
      return;
    }

    console.log(`🚀 Running ${testSuite.name} Tests\n`);
    console.log('='.repeat(60));

    this.startTime = Date.now();
    testSuite.suite.runAllTests();
    this.endTime = Date.now();

    this.totalPassed = testSuite.suite.passed;
    this.totalFailed = testSuite.suite.failed;
    this.printFinalSummary();
  }

  /**
   * Prints the final test summary.
   */
  printFinalSummary() {
    const totalTests = this.totalPassed + this.totalFailed;
    const successRate = totalTests > 0 ? (this.totalPassed / totalTests) * 100 : 0;
    const duration = this.endTime - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${this.totalPassed}`);
    console.log(`❌ Failed: ${this.totalFailed}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⏱️  Duration: ${duration}ms`);

    if (this.totalFailed === 0) {
      console.log('\n🎉 All tests passed! The JavaScript library is ready for use.');
    } else {
      console.log(`\n⚠️  ${this.totalFailed} test(s) failed. Please review the errors above.`);
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Gets test statistics.
   */
  getTestStats() {
    const totalTests = this.totalPassed + this.totalFailed;
    const successRate = totalTests > 0 ? (this.totalPassed / totalTests) * 100 : 0;

    return {
      totalTests,
      passed: this.totalPassed,
      failed: this.totalFailed,
      successRate,
      duration: this.endTime ? this.endTime - this.startTime : 0,
    };
  }
}

/**
 * Runs tests based on command line arguments.
 */
async function main() {
  const args = process.argv.slice(2);
  const testRunner = new TestRunner();

  if (args.length === 0) {
    // Run all tests
    await testRunner.runAllTests();
  } else {
    // Run specific test suite
    const suiteName = args[0];
    await testRunner.runTestSuite(suiteName);
  }

  // Exit with appropriate code
  const stats = testRunner.getTestStats();
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Run if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  main().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export default TestRunner;
