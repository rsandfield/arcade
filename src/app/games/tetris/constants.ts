export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;
export const LINES_PER_LEVEL = 10;

export const COLORS = [
  'none',
  'cyan',
  'blue',
  'orange',
  'yellow',
  'green',
  'purple',
  'red'
];

export const LOSS_COLOR = "#FF6666"

export const SHAPES = [
    [],
    [   // I
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    [   // J
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    [   // L
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    [   // O
        [4, 4],
        [4, 4]
    ],
    [   // S
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    [   // T
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    [   // Z
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

export const MAX_COMBO = 4;

export enum POINTS {
    SINGLE = 100,
    DOUBLE = 200,
    TRIPLE = 500,
    TETRIS = 800,
    SOFT_DROP = 1,
    HARD_Drop = 2
}

export let LEVEL: number[] = [
    800,
    720,
    630,
    550,
    470,
    380,
    300,
    130,
    100,
    80,
    80,
    80,
    70,
    70,
    70,
    50,
    50,
    50,
    30,
    30
]