import mongoose from 'mongoose';
import { Device, Metric } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const listDevices = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const { limit, page, search, source, status } = request.query;
  const filter = {};

  if (status) filter.status = status;
  if (source) filter.source = source;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { hostname: { $regex: search, $options: 'i' } },
      { ipAddress: { $regex: search, $options: 'i' } },
      { operatingSystem: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [devices, total] = await Promise.all([
    Device.find(filter).sort({ status: 1, lastSeenAt: -1 }).skip(skip).limit(limit),
    Device.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      devices: devices.map((device) => device.toClientJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getDeviceById = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const device = await Device.findById(request.params.id);

  if (!device) {
    throw new ApiError(404, 'DEVICE_NOT_FOUND', 'The requested device was not found.');
  }

  const metrics = await Metric.find({ deviceId: new mongoose.Types.ObjectId(request.params.id) })
    .sort({ timestamp: -1 })
    .limit(100);

  response.json({
    success: true,
    data: {
      device: device.toClientJSON(),
      metrics: metrics.reverse().map((metric) => metric.toClientJSON()),
    },
  });
});
