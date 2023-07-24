const game_params = require('../../src/middleware/game_params');
const { models } = require('../../src/models');
const ControllerUtils = require('../../src/utils/controller_utils');
const enums = require('../../src/enum')

jest.mock('../../src/models', () => {
  return {
    models: {
      Card: {
        findByPk: jest.fn(),
      },
      TableHand: {
        findByPk: jest.fn(),
      },
      User: {
        findByPk: jest.fn(),
      },
      Game: {
        findByPk: jest.fn(),
      },
    },
  };
});
jest.mock('../../src/utils/controller_utils');

const mockReq = {
  body: {
    jwt: { user_id: 1 },
  },
  params: {
    game_id: 42,
  },
  query: {
    hand_id: 123,
  },
};

const mockRes = {
  status: jest.fn(() => mockRes),
  send: jest.fn(),
};

describe('game_params middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let mockUser, mockGame, mockTableHand;

  beforeEach(() => {
    mockUser = { id: 1, name: 'John' };
    mockGame = {
      id: 42,
      name: 'Sample Game',
      deck: { id: 99, name: 'Sample Deck' },
    };
    mockTableHand = { id: 123, cards: ['card1', 'card2'] };
    models.User.findByPk.mockResolvedValue(mockUser);
    models.Game.findByPk.mockResolvedValue(mockGame);
    models.TableHand.findByPk.mockResolvedValue(mockTableHand);
  });

  it('should set req.user, req.game, req.deck, and req.table_hand', async () => {
    const next = jest.fn();
    await game_params()(mockReq, mockRes, next);

    expect(mockReq.body.user).toEqual(mockUser);
    expect(mockReq.body.game).toEqual(mockGame);
    expect(mockReq.body.deck).toEqual(mockGame.deck);
    expect(mockReq.body.table_hand).toEqual(mockTableHand);

    expect(next).toHaveBeenCalled();
  });

  it('should return a 400 status if game already compelted', async () => {
    models.Game.findByPk.mockResolvedValue({
      status: enums.game_status.COMPLETED,
      ...mockGame,
    });
    
    await game_params()(mockReq, mockRes, jest.fn());
    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'Game is already completed',
    });

    expect(jest.fn()).not.toHaveBeenCalled();
  })

  it('should handle missing user', async () => {
    models.User.findByPk.mockResolvedValue(null);

    await game_params()(mockReq, mockRes, jest.fn());
    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'User was not found',
    });

    expect(jest.fn()).not.toHaveBeenCalled();
  });

  it('should handle missing game', async () => {
    models.Game.findByPk.mockResolvedValue(null);
    await game_params()(mockReq, mockRes, jest.fn());
    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'Game was not found',
    });

    expect(jest.fn()).not.toHaveBeenCalled();
  });

  it('should handle missing deck', async () => {
    models.Game.findByPk.mockResolvedValue({
      id: 42,
      name: 'Sample Game',
      deck: null,
    });
    await game_params()(mockReq, mockRes, jest.fn());

    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'Deck was not found',
    });

    expect(jest.fn()).not.toHaveBeenCalled();
  });

  it('should handle missing table hand', async () => {
    models.TableHand.findByPk.mockResolvedValue(null);
    await game_params()(mockReq, mockRes, jest.fn());

    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'Table hand was not found',
    });
    expect(jest.fn()).not.toHaveBeenCalled();
  });
  it('should handle table hand with winner', async () => {
    models.TableHand.findByPk.mockResolvedValue({...mockTableHand, winner: 'player'});
    await game_params()(mockReq, mockRes, jest.fn());

    expect(ControllerUtils.send_error_response).toHaveBeenCalledWith({
      res: mockRes,
      message: 'This table hand already have finished',
    });
    expect(jest.fn()).not.toHaveBeenCalled();
  });
  it('should set req properties based on check_models', async () => {
    const next = jest.fn();
    await game_params(['user', 'game'])(mockReq, mockRes, next);

    expect(mockReq.body.user).toEqual(mockUser);
    expect(mockReq.body.game).toEqual(mockGame);
    expect(mockReq.deck).toBeUndefined();
    expect(mockReq.table_hand).toBeUndefined();

    expect(next).toHaveBeenCalled();
  });
});
