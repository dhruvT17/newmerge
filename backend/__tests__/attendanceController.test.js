const attendanceCtrl = require('../controllers/attendanceController');

jest.mock('../models/Attendance', () => ({
  create: jest.fn(),
  findOne: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(null),
}));
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
}));

const Attendance = require('../models/Attendance');
const User = require('../models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Attendance Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prevents check-in if already checked-in', async () => {
    const req = { user: { credentialId: 'cred1' }, body: { descriptor: new Array(128).fill(0) } };
    const res = mockRes();
    User.findOne.mockResolvedValue({ _id: 'u1', faceData: { frontDescriptor: new Array(128).fill(0) } });
    Attendance.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue({ _id: 'a1' }) });

    await attendanceCtrl.checkIn(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Already checked-in') }));
  });

  test('check-in succeeds when no active record and face matches', async () => {
    const req = { user: { credentialId: 'cred1' }, body: { descriptor: new Array(128).fill(0) } };
    const res = mockRes();
    User.findOne.mockResolvedValue({ _id: 'u1', faceData: { frontDescriptor: new Array(128).fill(0) } });
    Attendance.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });
    Attendance.create.mockResolvedValue({ _id: 'a2', userId: 'u1', status: 'checked-in' });

    await attendanceCtrl.checkIn(req, res);

    expect(Attendance.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});






