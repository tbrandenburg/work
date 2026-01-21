# Enhanced Where Clause Features - Task Tracking

## Task 1: UPDATE src/types/errors.ts (add query syntax errors)
- [x] Read MIRROR pattern from src/types/errors.ts:25-35
- [x] Implement QuerySyntaxError class
- [x] Implement UnsupportedOperatorError class  
- [x] Implement InvalidDateError class
- [x] Run type-check validation
- [x] Run functional test

## Task 2: UPDATE src/core/query.ts (replace with new query AST types)
- [x] Read existing QueryOptions interface
- [x] Replace QueryOptions interface
- [x] Add QueryCondition interface
- [x] Add ComparisonOperator type
- [x] Add LogicalOperator type
- [x] Run type-check validation

## Task 3: UPDATE src/core/query.ts (replace with tokenizer function)
- [x] Read existing parseQuery function pattern
- [x] Replace parseQuery function with tokenizer
- [x] Implement tokenizeQuery function with operator recognition
- [x] Handle quoted strings and escape sequences
- [x] Run type-check validation
- [x] Run lint validation
- [x] Add integration test for tokenizer

## Task 4: UPDATE src/core/query.ts (replace with parser function)
- [x] Read existing parsing logic pattern
- [x] Replace existing parsing logic with parseWhereClause function
- [x] Implement recursive descent parser for logical expressions
- [x] Handle operator precedence correctly
- [x] Run type-check validation
- [x] Run lint validation
- [x] Add integration test for parser

## Task 5: UPDATE src/core/query.ts (add date parsing and evaluator)
- [x] Read existing value handling pattern
- [x] Add parseValue function
- [x] Add evaluateCondition function
- [x] Implement ISO date parsing
- [x] Implement recursive AST evaluation
- [x] Run type-check validation
- [x] Run lint validation
- [x] Run functional CLI test
- [x] Add E2E test for complete query evaluation

## Task 6: UPDATE tests/unit/core/query.test.ts (replace with comprehensive tests)
- [x] Read existing test structure pattern
- [x] Replace existing tests with new query feature tests
- [x] Implement tests for comparison operators
- [x] Implement tests for logical operators
- [x] Implement tests for date comparisons
- [x] Implement tests for error cases
- [x] Run test coverage validation (>=40%)
- [x] Add critical user journey test

## Validation Checkpoints
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with >=40% coverage
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: CLI validation passes
- [ ] All acceptance criteria met
