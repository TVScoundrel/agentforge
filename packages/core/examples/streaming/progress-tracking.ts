/**
 * Progress Tracking Example
 * 
 * Demonstrates tracking long-running agent operations:
 * - Progress percentage calculation
 * - ETA estimation
 * - Cancellation support
 * - Progress callbacks
 */

import { createProgressTracker } from '../../src/streaming';

// Simulate a long-running task
async function simulateTask(steps: number, delayMs: number, onProgress: (step: number) => void) {
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    onProgress(i + 1);
  }
}

// Example 1: Basic progress tracking
async function basicProgressExample() {
  console.log('\n=== Basic Progress Example ===');
  console.log('Tracking progress of a 10-step task...\n');

  const tracker = createProgressTracker({
    total: 10,
    onProgress: (progress) => {
      const bar = '█'.repeat(Math.floor(progress.percentage / 5)) + 
                  '░'.repeat(20 - Math.floor(progress.percentage / 5));
      console.log(`[${bar}] ${progress.percentage.toFixed(1)}% (${progress.current}/${progress.total})`);
    },
    onComplete: () => {
      console.log('✅ Task completed!\n');
    }
  });

  tracker.start();
  
  await simulateTask(10, 200, (step) => {
    tracker.update(step);
  });

  tracker.complete();
}

// Example 2: Progress with ETA
async function etaProgressExample() {
  console.log('\n=== Progress with ETA Example ===');
  console.log('Tracking progress with estimated time remaining...\n');

  const tracker = createProgressTracker({
    total: 20,
    onProgress: (progress) => {
      const eta = progress.eta ? `ETA: ${(progress.eta / 1000).toFixed(1)}s` : 'Calculating...';
      console.log(`Progress: ${progress.percentage.toFixed(1)}% | ${eta}`);
    },
    onComplete: () => {
      console.log('✅ Task completed!\n');
    }
  });

  tracker.start();
  
  await simulateTask(20, 100, (step) => {
    tracker.update(step);
  });

  tracker.complete();
}

// Example 3: Cancellable progress
async function cancellableProgressExample() {
  console.log('\n=== Cancellable Progress Example ===');
  console.log('Tracking progress with cancellation support...\n');

  const tracker = createProgressTracker({
    total: 30,
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
    },
    onCancel: () => {
      console.log('❌ Task cancelled!\n');
    },
    onComplete: () => {
      console.log('✅ Task completed!\n');
    }
  });

  tracker.start();
  
  // Simulate task with cancellation after 50%
  let cancelled = false;
  for (let i = 1; i <= 30; i++) {
    if (cancelled) break;
    
    await new Promise(resolve => setTimeout(resolve, 50));
    tracker.update(i);
    
    // Cancel at 50%
    if (i === 15) {
      console.log('\n⚠️  Cancelling task...\n');
      tracker.cancel();
      cancelled = true;
    }
  }
}

// Example 4: Multi-stage progress
async function multiStageProgressExample() {
  console.log('\n=== Multi-Stage Progress Example ===');
  console.log('Tracking progress across multiple stages...\n');

  const stages = [
    { name: 'Initialization', steps: 5 },
    { name: 'Processing', steps: 10 },
    { name: 'Finalization', steps: 3 }
  ];

  const totalSteps = stages.reduce((sum, stage) => sum + stage.steps, 0);
  let currentStep = 0;

  const tracker = createProgressTracker({
    total: totalSteps,
    onProgress: (progress) => {
      const bar = '█'.repeat(Math.floor(progress.percentage / 5)) + 
                  '░'.repeat(20 - Math.floor(progress.percentage / 5));
      console.log(`[${bar}] ${progress.percentage.toFixed(1)}%`);
    }
  });

  tracker.start();

  for (const stage of stages) {
    console.log(`\n📍 Stage: ${stage.name}`);
    
    for (let i = 0; i < stage.steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      currentStep++;
      tracker.update(currentStep);
    }
  }

  tracker.complete();
  console.log('✅ All stages completed!\n');
}

// Example 5: Agent workflow progress
async function agentWorkflowExample() {
  console.log('\n=== Agent Workflow Progress Example ===');
  console.log('Tracking progress of a multi-step agent workflow...\n');

  const workflow = [
    'Understanding query',
    'Planning approach',
    'Gathering information',
    'Analyzing data',
    'Generating response',
    'Reviewing output'
  ];

  const tracker = createProgressTracker({
    total: workflow.length,
    onProgress: (progress) => {
      const currentTask = workflow[progress.current - 1];
      const eta = progress.eta ? ` (ETA: ${(progress.eta / 1000).toFixed(1)}s)` : '';
      console.log(`[${progress.current}/${progress.total}] ${currentTask}${eta}`);
    },
    onComplete: () => {
      console.log('\n✅ Agent workflow completed!\n');
    }
  });

  tracker.start();

  for (let i = 0; i < workflow.length; i++) {
    // Simulate varying task durations
    const duration = 200 + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, duration));
    tracker.update(i + 1);
  }

  tracker.complete();
}

// Example 6: Progress with custom metadata
async function metadataProgressExample() {
  console.log('\n=== Progress with Metadata Example ===');
  console.log('Tracking progress with custom metadata...\n');

  interface CustomProgress {
    itemsProcessed: number;
    errorsEncountered: number;
    currentItem: string;
  }

  const items = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];
  let errors = 0;

  const tracker = createProgressTracker({
    total: items.length,
    onProgress: (progress) => {
      console.log(`Processing: ${progress.current}/${progress.total} | Errors: ${errors}`);
    },
    onComplete: () => {
      console.log(`\n✅ Completed! Total errors: ${errors}\n`);
    }
  });

  tracker.start();

  for (let i = 0; i < items.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Simulate occasional errors
    if (Math.random() < 0.2) {
      errors++;
      console.log(`  ⚠️  Error processing ${items[i]}`);
    } else {
      console.log(`  ✓ Processed ${items[i]}`);
    }
    
    tracker.update(i + 1);
  }

  tracker.complete();
}

// Run all examples
async function main() {
  console.log('📊 AgentForge Progress Tracking Examples\n');
  
  await basicProgressExample();
  await etaProgressExample();
  await cancellableProgressExample();
  await multiStageProgressExample();
  await agentWorkflowExample();
  await metadataProgressExample();
  
  console.log('✅ All progress tracking examples completed!\n');
}

main().catch(console.error);

