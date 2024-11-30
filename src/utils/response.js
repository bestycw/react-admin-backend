/**
 * 统一响应工具
 * code: 200 成功, 400 客户端错误, 401 未授权, 403 禁止访问, 404 未找到, 500 服务器错误
 */
class ResponseUtil {
  static success(data = null, message = '操作成功') {
    return {
      code: 200,
      data,
      message
    };
  }

  static error(message = '操作失败', code = 500, data = null) {
    return {
      code,
      message,
      data
    };
  }

  static unauthorized(message = '未授权') {
    return this.error(message, 401);
  }

  static forbidden(message = '禁止访问') {
    return this.error(message, 403);
  }

  static notFound(message = '资源不存在') {
    return this.error(message, 404);
  }

  static badRequest(message = '请求参数错误') {
    return this.error(message, 400);
  }
}

module.exports = ResponseUtil; 