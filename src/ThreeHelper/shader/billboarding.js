/*
 * @Author: hongbin
 * @Date: 2025-09-13 20:14:30
 * @LastEditors: hongbin
 * @LastEditTime: 2025-09-15 15:48:04
 * @Description: 这可用于实现平面网格的广告牌行为。这意味着他们是 始终朝向相机。
 * from three.js SpriteUtils.js
 */

export const billboarding = `
// billboarding函数的GLSL实现
// 参数:
// - position: 可选的世界空间位置
// - horizontal: 水平方向是否朝向相机
// - vertical: 垂直方向是否朝向相机
vec4 billboarding(vec3 position,vec3 positionLocal, bool horizontal, bool vertical) {
    // 如果提供了自定义位置，更新模型矩阵的位置部分
    // 复制原始模型矩阵并更新位置
    mat4 adjustedModelMatrix = modelMatrix;
    adjustedModelMatrix[3][0] = position.x;
    adjustedModelMatrix[3][1] = position.y;
    adjustedModelMatrix[3][2] = position.z;
    
    mat4 modelViewMatrix = viewMatrix * adjustedModelMatrix;
    
    // 计算原始模型矩阵行的长度
    float xScale = length(vec3(modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]));
    float yScale = length(vec3(modelMatrix[1][0], modelMatrix[1][1], modelMatrix[1][2]));
    
    // 应用水平billboarding
    if (horizontal) {
        modelViewMatrix[0][0] = xScale;
        modelViewMatrix[0][1] = 0.0;
        modelViewMatrix[0][2] = 0.0;
    }
    
    // 应用垂直billboarding
    if (vertical) {
        modelViewMatrix[1][0] = 0.0;
        modelViewMatrix[1][1] = yScale;
        modelViewMatrix[1][2] = 0.0;
    }
    
    // 设置Z轴为朝向相机
    modelViewMatrix[2][0] = 0.0;
    modelViewMatrix[2][1] = 0.0;
    modelViewMatrix[2][2] = 1.0;
    
    // 计算最终的裁剪空间位置
    return projectionMatrix * modelViewMatrix * vec4(positionLocal, 1.0);
}
`