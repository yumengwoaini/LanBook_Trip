# 蓝书 - API文档

本文档详细说明了蓝书项目的API接口设计和使用方法。所有API均遵循RESTful设计原则，使用JSON格式进行数据交换。

## 基础信息

- **基础URL**: `http://localhost:5000/api`
- **认证方式**: JWT (JSON Web Token)
- **请求头**:
  - Content-Type: application/json
  - Authorization: Bearer {token} (需要认证的接口)

## 响应格式

所有API响应均使用以下格式：

```json
{
  "success": true/false,  // 请求是否成功
  "message": "...",       // 消息说明（可选）
  "data": { ... }         // 响应数据（可选）
}
```

## 错误处理

当请求失败时，服务器会返回对应的HTTP状态码和错误信息：

```json
{
  "success": false,
  "message": "错误信息"
}
```

常见HTTP状态码：
- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 用户相关API

### 用户注册

注册新用户，可选上传头像。

- **URL**: `/users/register`
- **方法**: `POST`
- **请求体**: `multipart/form-data`

请求参数：
| 参数名   | 类型   | 必需 | 描述         |
|---------|--------|------|-------------|
| username| string | 是   | 用户名，3-20字符 |
| password| string | 是   | 密码，至少6字符  |
| nickname| string | 是   | 用户昵称      |
| avatar  | file   | 否   | 用户头像图片   |

成功响应：
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "avatar": "avatar_path",
    "role": "user"
  }
}
```

### 用户登录

用户登录并获取JWT令牌。

- **URL**: `/users/login`
- **方法**: `POST`
- **请求体**: `application/json`

请求参数：
| 参数名   | 类型   | 必需 | 描述     |
|---------|--------|------|---------|
| username| string | 是   | 用户名   |
| password| string | 是   | 密码     |

成功响应：
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "avatar": "avatar_path",
    "role": "user"
  }
}
```

### 获取当前用户信息

获取当前登录用户的详细信息。

- **URL**: `/users/me`
- **方法**: `GET`
- **认证**: 必需

成功响应：
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "username",
    "nickname": "nickname",
    "avatar": "avatar_path",
    "role": "user"
  }
}
```

### 更新用户头像

更新当前用户的头像。

- **URL**: `/users/avatar`
- **方法**: `PUT`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名 | 类型 | 必需 | 描述     |
|-------|------|-----|---------|
| avatar| file | 是  | 新头像图片 |

成功响应：
```json
{
  "success": true,
  "avatar": "avatar_path"
}
```

### 更新用户昵称

更新当前用户的昵称。

- **URL**: `/users/nickname`
- **方法**: `PUT`
- **认证**: 必需
- **请求体**: `application/json`

请求参数：
| 参数名   | 类型   | 必需 | 描述     |
|---------|--------|-----|---------|
| nickname| string | 是  | 新昵称   |

成功响应：
```json
{
  "success": true,
  "nickname": "new_nickname"
}
```

## 游记相关API

### 获取游记列表

获取所有已审核通过的游记，支持分页和搜索。

- **URL**: `/travels`
- **方法**: `GET`
- **认证**: 不需要

查询参数：
| 参数名  | 类型   | 必需 | 描述           |
|--------|--------|-----|---------------|
| page   | number | 否  | 页码，默认1     |
| limit  | number | 否  | 每页数量，默认10 |
| keyword| string | 否  | 搜索关键词      |

成功响应：
```json
{
  "success": true,
  "count": 5,        // 当前页游记数量
  "total": 25,       // 总游记数
  "page": 1,         // 当前页码
  "pages": 3,        // 总页数
  "data": [
    {
      "id": "travel_id",
      "title": "游记标题",
      "content": "游记内容",
      "images": ["image1.jpg", "image2.jpg"],
      "video": "video.mp4",
      "author": {
        "id": "user_id",
        "nickname": "作者昵称",
        "avatar": "avatar_path"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    // 更多游记...
  ]
}
```

### 获取单个游记

获取单个游记的详细信息。

- **URL**: `/travels/:id`
- **方法**: `GET`
- **认证**: 可选（未审核游记需要认证）

成功响应：
```json
{
  "success": true,
  "data": {
    "id": "travel_id",
    "title": "游记标题",
    "content": "游记内容",
    "images": ["image1.jpg", "image2.jpg"],
    "video": "video.mp4",
    "author": {
      "id": "user_id",
      "nickname": "作者昵称",
      "avatar": "avatar_path"
    },
    "status": "approved",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 创建游记

创建新的游记，需要上传图片，可选上传视频。

- **URL**: `/travels`
- **方法**: `POST`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名  | 类型    | 必需 | 描述        |
|--------|---------|-----|------------|
| title  | string  | 是  | 游记标题     |
| content| string  | 是  | 游记内容     |
| images | file[]  | 是  | 游记图片，可多张 |
| video  | file    | 否  | 游记视频     |

成功响应：
```json
{
  "success": true,
  "data": {
    "id": "travel_id",
    "title": "游记标题",
    "content": "游记内容",
    "images": ["images/image1.jpg", "images/image2.jpg"],
    "video": "videos/video.mp4",
    "author": "user_id",
    "status": "pending",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 更新游记

更新现有游记，仅作者可操作，且只能更新待审核或被拒绝的游记。

- **URL**: `/travels/:id`
- **方法**: `PUT`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名  | 类型    | 必需 | 描述        |
|--------|---------|-----|------------|
| title  | string  | 是  | 游记标题     |
| content| string  | 是  | 游记内容     |
| images | file[]  | 否  | 新游记图片   |
| video  | file    | 否  | 新游记视频   |

成功响应：
```json
{
  "success": true,
  "data": {
    "id": "travel_id",
    "title": "更新的标题",
    "content": "更新的内容",
    "images": ["images/image1.jpg", "images/image2.jpg"],
    "video": "videos/video.mp4",
    "author": "user_id",
    "status": "pending",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

### 删除游记

删除游记，作者可物理删除，管理员可逻辑删除。

- **URL**: `/travels/:id`
- **方法**: `DELETE`
- **认证**: 必需

成功响应：
```json
{
  "success": true,
  "message": "游记已删除"
}
```

### 获取我的游记

获取当前用户发布的所有游记，包括待审核、已通过和被拒绝的。

- **URL**: `/travels/my/travels`
- **方法**: `GET`
- **认证**: 必需

查询参数：
| 参数名 | 类型   | 必需 | 描述           |
|-------|--------|-----|---------------|
| page  | number | 否  | 页码，默认1     |
| limit | number | 否  | 每页数量，默认10 |

成功响应：
```json
{
  "success": true,
  "count": 5,        // 当前页游记数量
  "total": 15,       // 总游记数
  "page": 1,         // 当前页码
  "pages": 2,        // 总页数
  "data": [
    {
      "id": "travel_id",
      "title": "游记标题",
      "content": "游记内容",
      "images": ["image1.jpg", "image2.jpg"],
      "video": "video.mp4",
      "status": "pending",
      "rejectReason": "",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    // 更多游记...
  ]
}
```

### 获取管理员游记列表

获取所有游记（包括待审核、已通过、已拒绝），仅管理员和审核员可访问。

- **URL**: `/travels/admin/all`
- **方法**: `GET`
- **认证**: 必需（管理员或审核员）

查询参数：
| 参数名 | 类型   | 必需 | 描述                                   |
|-------|--------|-----|---------------------------------------|
| page  | number | 否  | 页码，默认1                             |
| limit | number | 否  | 每页数量，默认10                         |
| status| string | 否  | 状态筛选（pending/approved/rejected）    |

成功响应：
```json
{
  "success": true,
  "count": 8,        // 当前页游记数量
  "total": 30,       // 总游记数
  "page": 1,         // 当前页码
  "pages": 4,        // 总页数
  "data": [
    {
      "id": "travel_id",
      "title": "游记标题",
      "content": "游记内容",
      "images": ["image1.jpg", "image2.jpg"],
      "video": "video.mp4",
      "author": {
        "id": "user_id",
        "nickname": "作者昵称",
        "avatar": "avatar_path"
      },
      "status": "pending",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    // 更多游记...
  ]
}
```

### 审核游记

审核游记，通过或拒绝，仅管理员和审核员可操作。

- **URL**: `/travels/:id/review`
- **方法**: `PUT`
- **认证**: 必需（管理员或审核员）
- **请求体**: `application/json`

请求参数：
| 参数名       | 类型   | 必需 | 描述                      |
|-------------|--------|-----|--------------------------|
| status      | string | 是  | 审核状态(approved/rejected) |
| rejectReason| string | 条件 | 拒绝原因，status为rejected时必需 |

成功响应：
```json
{
  "success": true,
  "data": {
    "id": "travel_id",
    "title": "游记标题",
    "content": "游记内容",
    "images": ["image1.jpg", "image2.jpg"],
    "video": "video.mp4",
    "author": {
      "id": "user_id",
      "nickname": "作者昵称",
      "avatar": "avatar_path"
    },
    "status": "approved", // 或 "rejected"
    "rejectReason": "拒绝原因",
    "reviewedBy": "reviewer_id",
    "reviewedAt": "2023-01-02T00:00:00.000Z",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

## 文件上传API

### 上传图片

上传一张或多张图片。

- **URL**: `/upload/images`
- **方法**: `POST`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名 | 类型   | 必需 | 描述        |
|-------|--------|-----|------------|
| images| file[] | 是  | 要上传的图片 |

成功响应：
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "filename": "image-12345.jpg",
      "path": "images/image-12345.jpg",
      "mimetype": "image/jpeg",
      "size": 123456
    },
    {
      "filename": "image-67890.jpg",
      "path": "images/image-67890.jpg",
      "mimetype": "image/jpeg",
      "size": 78901
    }
  ]
}
```

### 上传视频

上传一个视频文件。

- **URL**: `/upload/video`
- **方法**: `POST`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名 | 类型 | 必需 | 描述        |
|-------|------|-----|------------|
| video | file | 是  | 要上传的视频 |

成功响应：
```json
{
  "success": true,
  "data": {
    "filename": "video-12345.mp4",
    "path": "videos/video-12345.mp4",
    "mimetype": "video/mp4",
    "size": 5678901
  }
}
```

### 上传头像

上传用户头像。

- **URL**: `/upload/avatar`
- **方法**: `POST`
- **认证**: 必需
- **请求体**: `multipart/form-data`

请求参数：
| 参数名 | 类型 | 必需 | 描述        |
|-------|------|-----|------------|
| avatar| file | 是  | 要上传的头像 |

成功响应：
```json
{
  "success": true,
  "data": {
    "filename": "avatar-12345.jpg",
    "path": "avatars/avatar-12345.jpg",
    "mimetype": "image/jpeg",
    "size": 45678
  }
}
```

## 相关资源

- [[RESTful API设计]]
- [[JWT认证详解]]
- [[文件上传处理]] 