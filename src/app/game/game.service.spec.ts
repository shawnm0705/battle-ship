import { TestBed } from '@angular/core/testing';

import { GameService } from './game.service';

describe('GameService', () => {
  let gameService: GameService;
  beforeEach(() => TestBed.configureTestingModule({}));
  beforeEach(() => {
    gameService = TestBed.get(GameService);
  });

  it('should be created', () => {
    expect(gameService).toBeTruthy();
  });

  it(`validateShip() works`, () => {
    let testCases = [
      {
        size: 3,
        start: [3, 4],
        isHorizontal: true,
        ships: [],
        shipsPosition: [],
        result: {
          valid: true,
          ships: [[[3, 4], [3, 5], [3, 6]]],
          shipsPosition: []
        }
      },
      {
        size: 4,
        start: [3, 4],
        isHorizontal: false,
        ships: [],
        shipsPosition: [],
        result: {
          valid: true,
          ships: [[[3, 4], [4, 4], [5, 4], [6, 4]]],
          shipsPosition: []
        }
      },
      {
        size: 3,
        start: [2, 8],
        isHorizontal: true,
        ships: [],
        shipsPosition: [],
        result: {
          valid: false
        }
      },
      {
        size: 5,
        start: [6, 4],
        isHorizontal: false,
        ships: [],
        shipsPosition: [],
        result: {
          valid: false
        }
      }
    ];
    testCases.forEach(testCase => {
      // create expected shipsPositions array based on ships
      testCase.shipsPosition = gameService.initialiseBoard(false);
      testCase.ships.forEach(ship => {
        ship.forEach(position => {
          testCase.shipsPosition[position[0]][position[1]] = true;
        });
      });
      if (testCase.result.valid) {
        testCase.result.shipsPosition = gameService.initialiseBoard(false);
        testCase.result.ships.forEach(ship => {
          ship.forEach(position => {
            testCase.result.shipsPosition[position[0]][position[1]] = true;
          });
        });
      }
      let result = gameService.validateShip(testCase.size, testCase.start, testCase.isHorizontal, testCase.ships, testCase.shipsPosition);
      // test validation result
      expect(result.valid).toBe(testCase.result.valid);
      if (result.valid) {
        // test number of ships
        expect(result.ships.length).toBe(testCase.result.ships.length);
        // test ships array
        result.ships.forEach((ship, i) => {
          // test ship size
          expect(ship.length).toBe(testCase.result.ships[i].length);
          ship.forEach((p, j) => {
            // test each ship position
            expect(p[0]).toBe(testCase.result.ships[i][j][0]);
            expect(p[1]).toBe(testCase.result.ships[i][j][1]);
          });
        });
        // test ships position array
        testCase.result.shipsPosition.forEach((row, i) => {
          row.forEach((cell, j) => {
            expect(result.shipsPosition[i][j]).toBe(cell);
          });
        });
      }
    });
  });

  it(`validatePosition() works`, () => {
    let testCases = [
      {
        position: [3, 4],
        result: true
      },
      {
        position: [4, 10],
        result: false
      },
      {
        position: [0, 9],
        result: true
      },
      {
        position: [-1, 1],
        result: false
      }
    ];
    testCases.forEach(testCase => {
      let result = gameService.validatePosition(testCase.position);
      expect(result).toBe(testCase.result);
    });
  });

  it(`positionIncludes() works`, () => {
    let testCases = [
      {
        positionArray: [[1, 2], [2, 3], [3, 4]],
        position: [3, 4],
        result: true
      },
      {
        positionArray: [[1, 2], [2, 3], [3, 4]],
        position: [4, 3],
        result: false
      }
    ];
    testCases.forEach(testCase => {
      let result = gameService.positionIncludes(testCase.positionArray, testCase.position);
      expect(result).toBe(testCase.result);
    });
  });

  it(`randomPosition() works`, () => {
    let position = gameService.randomPosition();
    expect(position).toBeTruthy();
    expect(position[0]).toBeGreaterThan(-1);
    expect(position[0]).toBeLessThan(10);
    expect(position[1]).toBeGreaterThan(-1);
    expect(position[1]).toBeLessThan(10);
  });

});
