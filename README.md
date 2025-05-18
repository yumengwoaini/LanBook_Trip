# 蓝书 - 一站式游记分享平台

## 项目概述
蓝书是一个专注于旅游日记分享的平台，为用户提供了发布、查看和分享游记的一站式服务。项目分为移动端用户系统和PC站点审核管理系统两部分：

- **移动端用户系统**：基于React Native和Expo构建，用于游记的发布、查看和分享
- **PC站点审核管理系统**：基于React构建，用于游记内容的审核管理

## 技术栈
- **前端**：
  - 移动端：React Native + Expo
  - PC端：React + React Router + Ant Design
- **后端**：Node.js + Express
- **数据库**：MongoDB
- **文件存储**：本地存储/云存储

## 功能特点
- 移动端用户系统：
  - 游记瀑布流展示
  - 游记发布与编辑
  - 图片与视频上传
  - 用户注册登录
  - 游记详情查看与分享
- PC站点审核管理系统：
  - 游记审核流程
  - 多角色权限管理
  - 内容管理功能

## 运行项目
### 前提条件
- Node.js 14.0+
- MongoDB
- Expo CLI (移动端开发)

### 安装步骤
```bash
# 克隆仓库
git clone <repository-url>

# 安装后端依赖
cd server
npm install

# 安装PC端依赖
cd ../admin
npm install

# 安装移动端依赖
cd ../mobile
npm install
```

### 启动项目
```bash
# 启动后端服务
cd server
npm start

# 启动PC管理系统
cd ../admin
npm start

# 启动移动端应用
cd ../mobile
expo start
```

## 项目结构
```
ctrip项目/
├── server/           # 后端服务
├── admin/            # PC端管理系统
├── mobile/           # 移动端应用
├── .notes/           # 开发笔记
└── README.md         # 项目说明
```

## 开发进度
详见 [catalogue.md](./catalogue.md) 了解项目的开发流程和功能实现情况。 