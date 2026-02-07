/*
 * @Author: hongbin
 * @Date: 2023-01-07 10:12:47
 * @LastEditors: hongbin
 * @LastEditTime: 2025-09-30 18:03:50
 * @Description:
 */
import * as THREE from "three";
// import * as CANNON from "cannon-es";
import * as CANNON from "@/src/ThreeHelper/addons/cannon-es/cannon-es";

/**
 * 继承自THREE.Color的随机颜色
 */
export class RandomColor extends THREE.Color {
    constructor() {
        super();
        this.r = Math.random();
        this.g = Math.random();
        this.b = Math.random();
    }
}

export function distance(x1: number, x2: number) {
    //都是负数  -3 => -5 = -2
    if (x1 < 0 && x2 < 0) {
        return (x2 * -1 - x1 * -1) * -1;
    }
    return x2 - x1;
}

/**
 * subQuaternion的减法
 */
export function subQuaternion(old: THREE.Quaternion, ter: THREE.Quaternion) {
    const x = distance(old.x, ter.x);
    const y = distance(old.y, ter.y);
    const z = distance(old.z, ter.z);
    const w = distance(old.w, ter.w);
    return new THREE.Quaternion(x, y, z, w);
}

function quaternionToEuler(q: THREE.Quaternion) {
    return new THREE.Euler().setFromQuaternion(q);
}

/**
 * 计算两个旋转的差值 返回需要旋转角度小的那个Quaternion
 * 旋转90度和-270度都在一个位置 但是旋转-270度看起来就会转一圈再到角度 效果不好
 */
export function compareQuaternion(q1: THREE.Quaternion, q2: THREE.Quaternion) {
    const subQ1 = subQuaternion(q1, q2);
    const subQ2 = subQuaternion(q2, q1);
    console.log(subQ1, subQ2);
    const subE1 = quaternionToEuler(subQ1);
    const subE2 = quaternionToEuler(subQ2);
    console.log(subE1, subE2);
}

/**
 * 获取mesh三角面 可用于与胶囊体，射线、球体进行碰撞检测
 * 代码取自THREE 的octree
 */
export const getMeshTriangles = (mesh: Mesh) => {
    const positionAttribute = mesh.geometry.getAttribute("position");
    const triangles = [] as THREE.Triangle[];

    for (let i = 0; i < positionAttribute.count; i += 3) {
        const v1 = new THREE.Vector3().fromBufferAttribute(
            positionAttribute,
            i
        );
        const v2 = new THREE.Vector3().fromBufferAttribute(
            positionAttribute,
            i + 1
        );
        const v3 = new THREE.Vector3().fromBufferAttribute(
            positionAttribute,
            i + 2
        );

        v1.applyMatrix4(mesh.matrixWorld);
        v2.applyMatrix4(mesh.matrixWorld);
        v3.applyMatrix4(mesh.matrixWorld);
        const triangle = new THREE.Triangle(v1, v2, v3);
        triangle.mesh = mesh;
        triangle.name = mesh.name;
        triangles.push(triangle);
    }

    mesh.userData.triangles = triangles;
    return { triangles, translate: () => {} };
};

const vec = new THREE.Vector3();
const pos = new THREE.Vector3();

export const pointToWorld = (
    x: number,
    y: number,
    camera: THREE.Camera,
    fixedZ?: number
) => {
    vec.set(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
    );

    // 根据二维坐标获取三维坐标
    vec.unproject(camera);

    // 设置z轴
    vec.sub(camera.position).normalize();

    let distance;

    if (fixedZ) {
        // 需要固定点z = targetZ，将距离计算替换为： (targetZ - camera.position) / vec.z
        distance = (fixedZ - camera.position.z) / vec.z;
    } else {
        distance = -camera.position.z / vec.z;
    }

    pos.copy(camera.position).add(vec.multiplyScalar(distance));

    return pos;
};

/**
 * 根据 Three.js 的 Plane Mesh 创建对应的 Cannon-ES Body
 * @param {THREE.Mesh} mesh - Three.js 平面网格
 * @param {number} mass - 刚体质量 (0 = 静态)
 * @returns {CANNON.Body}
 */
export function createPlaneBodyFromMesh(
    mesh: THREE.Mesh<
        THREE.BufferGeometry & {
            parameters: { width: number; height: number };
        },
        THREE.Material
    >,
    mass = 0
) {
    // 从几何体中获取宽高
    let width = 1;
    let height = 1;

    if (mesh.geometry.parameters) {
        width = mesh.geometry.parameters.width || 1;
        height = mesh.geometry.parameters.height || 1;
    }

    // 考虑缩放
    width *= mesh.scale.x;
    height *= mesh.scale.y;

    // Cannon Box 半宽高（注意要除以 2）
    const halfExtents = new CANNON.Vec3(width / 2, height / 2, 0.01); // 厚度 0.02
    const shape = new CANNON.Box(halfExtents);

    const body = new CANNON.Body({
        mass,
        shape,
    });

    // 复制位置
    body.position.copy(mesh.position);

    // 复制旋转（Three.js 是 Quaternion，Cannon 也支持 Quaternion）
    body.quaternion.copy(mesh.quaternion);

    return body;
}

const v3 = new THREE.Vector3();
const q4 = new THREE.Quaternion();

/**
 * 根据 Three.js 的 Box Mesh 创建 Cannon-ES Body
 * @param {THREE.Mesh} mesh - Three.js Box 网格
 * @param {number} mass - 刚体质量（0 = 静态）
 * @returns {CANNON.Body}
 */
export function createBoxBodyFromMesh(mesh: THREE.Mesh, mass = 0) {
    // 从几何体获取宽高深
    let width = 1,
        height = 1,
        depth = 1;

    // @ts-ignore
    const parameters = mesh.geometry.parameters;

    if (parameters) {
        width = parameters.width || 1;
        height = parameters.height || 1;
        depth = parameters.depth || 1;
    }

    // 考虑缩放
    width *= mesh.scale.x;
    height *= mesh.scale.y;
    depth *= mesh.scale.z;

    // Cannon-ES 需要半尺寸
    const halfExtents = new CANNON.Vec3(width / 2, height / 2, depth / 2);
    const shape = new CANNON.Box(halfExtents);

    // 创建 Body
    const body = new CANNON.Body({
        mass,
        shape,
    });

    // 复制位置和旋转
    body.position.copy(mesh.getWorldPosition(v3));
    body.quaternion.copy(mesh.getWorldQuaternion(q4));

    return body;
}

// const typeMap = {
//     Float32Array: THREE.FloatType,
//     Uint8Array: THREE.UnsignedByteType,
//     Uint16Array: THREE.UnsignedShortType,
//     Uint32Array: THREE.UnsignedIntType,
//     Int8Array: THREE.ByteType,
//     Int16Array: THREE.ShortType,
//     Int32Array: THREE.IntType,
//     Uint8ClampedArray: THREE.UnsignedByteType,
// };

function float32ToUint8Clamped(float32Array: Float32Array) {
    // 创建一个新的 Uint8ClampedArray，长度与原 Float32Array 相同
    const uint8ClampedArray = new Uint8ClampedArray(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
        // 将值限制在 0 到 255 之间
        uint8ClampedArray[i] = Math.max(
            0,
            Math.min(255, float32Array[i] * 255)
        );
    }

    return uint8ClampedArray;
}

/**
 * 预览渲染目标(RenderTarget)
 */
export function previewRenderTarget(
    renderer: THREE.WebGLRenderer,
    rt: THREE.WebGLRenderTarget
) {
    const { width, height } = rt;
    //数据类型根据type决定 可观察浏览器控制台webgl报错会提示该用什么类型的数据
    // let pixels = new Uint8ClampedArray(width * height * 4);
    let pixels: Float32Array | Uint8ClampedArray;

    pixels = new Float32Array(width * height * 4);

    renderer.readRenderTargetPixels(rt, 0, 0, width, height, pixels);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    pixels = float32ToUint8Clamped(pixels);

    console.log(pixels)

    if (ctx) {
        // 如果不是 Uint8ClampedArray 则转换成 Uint8ClampedArray类型数据
        // const _data = Uint8ClampedArray.from(data.data);

        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);

        // const imageData = new ImageData(pixels, 2048, 2048);

        // ctx.putImageData(imageData, 0, 0);

        document.body.appendChild(canvas);
        canvas.style.position = "fixed";
        canvas.style.zIndex = "999";
        canvas.style.left = 0 + "px";
        canvas.style.top = 0 + "px";
        canvas.style.width = "200px";
        canvas.style.height = "200px";
    }
}
