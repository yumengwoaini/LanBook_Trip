import request from '../utils/request';

// 获取游记列表
export const getTravelNotes = (params) => {
  return request({
    url: '/travels/admin/all',
    method: 'get',
    params
  });
};

// 获取游记详情
export const getTravelNoteDetail = (id) => {
  return request({
    url: `/travels/${id}`,
    method: 'get'
  });
};

// 审核通过游记
export const approveTravelNote = (id) => {
  return request({
    url: `/travels/${id}/review`,
    method: 'put',
    data: { status: 'approved' }
  });
};

// 审核拒绝游记
export const rejectTravelNote = (id, rejectReason) => {
  return request({
    url: `/travels/${id}/review`,
    method: 'put',
    data: { status: 'rejected', rejectReason }
  });
};

// 删除游记
export const deleteTravelNote = (id) => {
  return request({
    url: `/travels/${id}`,
    method: 'delete'
  });
}; 