/*
 * @Author: hongbin
 * @Date: 2022-12-10 11:12:36
 * @LastEditors: hongbin
 * @LastEditTime: 2025-10-17 13:57:04
 * @Description:初始化环境
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OrbitControls as MyOrbitControls } from "../addons/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ModelsLoad } from "./ModelLoad";
import { Sky } from "three/examples/jsm/objects/Sky";
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer.js";

interface ICanvasLayout {
    width: number;
    height: number;
    /**
     * 像素比 越高越清晰 开销越大
     */
    pixelRatio: number;
}

interface ISetCamera {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
}

type IProps = THREE.WebGLRendererParameters & {
    /**
     * 是否限制渲染像素 过大开销容易卡顿
     * 默认限制最大为 2
     * 若不限制则采用设备的最大像素比
     */
    limitPixelRatio?: boolean;
};

/**
 * 初始化 scene camera renderer lights
 */
export class BaseEnvironment extends ModelsLoad {
    renderer!: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
    lights: THREE.Light[] = [];
    scene = new THREE.Scene();
    controls!: OrbitControls;
    canvas: IProps["canvas"];
    pmremGenerator!: THREE.PMREMGenerator;
    ResizeFn: VoidFunction[] = [];
    labelRenderer?: CSS2DRenderer;

    constructor(params: IProps) {
        super();
        this.canvas = params.canvas;
        this.initRenderer(params);

        this.pmremGenerator = new THREE.PMREMGenerator(
            this.renderer as THREE.WebGLRenderer
        );
        this.initScene();
    }

    /**
     * 初始化环境
     */
    // initEnv(
    //     parameters?: IProps,
    //     canvasLayout?: ICanvasLayout
    // ) {
    // this.initRenderer(parameters, canvasLayout);
    // this.initScene();
    // }

    setCamera = (params: Partial<ISetCamera>) => {
        Object.assign(this.camera, params);
    };

    setLightIntensity(intensity: number) {
        this.lights.forEach((l) => {
            l.intensity = l.userData.intensity * intensity;
        });
    }

    protected initScene() {
        // this.initLights();
        // this.initCssLabel();
        this.orbitControls();
        // this.useRoomEnvironment();
    }

    initCssLabel() {
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.className = "CSSLabel";
        this.labelRenderer.domElement.style.position = "absolute";
        this.labelRenderer.domElement.style.top = "0px";
        document.body.appendChild(this.labelRenderer.domElement);
    }

    /** 设置全景贴图背景
     * @param path string 贴图的地址 目录下贴图名默认为 px py规格
     * @param ext string 文件拓展名 默认png
     */
    async setBackgroundHDR(path: string, ext = "png") {
        // const loader = new HDRCubeTextureLoader();
        const loader = new THREE.CubeTextureLoader();
        // const loader = new RGBMLoader();
        loader.setPath(path.replace(/\/public/, ""));

        const textureCube = await loader.loadAsync([
            "px." + ext,
            "nx." + ext,
            "py." + ext,
            "ny." + ext,
            "pz." + ext,
            "nz." + ext,
        ]);
        // const textureCube = await loader.loadCubemapAsync([
        //     "px." + ext,
        //     "nx." + ext,
        //     "py." + ext,
        //     "ny." + ext,
        //     "pz." + ext,
        //     "nz." + ext,
        // ]);
        // const textureLoader = new THREE.TextureLoader();

        // const textureEquirec = textureLoader.load(
        //     "textures/2294472375_24a3b8ef46_o.jpg"
        // );

        /** WebGPU 设置背景 似乎必须加载完纹理 而不是promise */
        this.scene.background = textureCube;
        return textureCube;
    }

    useSkyEnvironment(env?: boolean) {
        if (!this.pmremGenerator) return;
        const sky = new Sky();
        this.scene.add(sky);
        sky.scale.setScalar(10000);
        this.scene.environment && (this.scene.environment.needsUpdate = true);
        const skyUniforms = sky.material.uniforms;
        skyUniforms["turbidity"].value = 1;
        skyUniforms["rayleigh"].value = 1;
        skyUniforms["mieCoefficient"].value = 0.005;
        skyUniforms["mieDirectionalG"].value = 0.8;

        const sun = new THREE.Vector3();

        sun.x = 0.1;
        sun.y = 0.4;
        sun.z = 1;
        sky.material.uniforms["sunPosition"].value.copy(sun);
        if (env) {
            this.scene.environment?.dispose();
            this.scene.environment = this.pmremGenerator.fromScene(
                sky as unknown as THREE.Scene
            ).texture;
        }
        return sky.material;
    }

    useRoomEnvironment() {
        if (this.pmremGenerator) {
            this.scene.environment?.dispose();
            this.scene.environment = this.pmremGenerator.fromScene(
                new RoomEnvironment(),
                0.04
            ).texture;
        }
        // this.scene.background = this.pmremGenerator.fromScene(
        //     new RoomEnvironment()
        // ).texture;
    }

    /**
     * 设置背景 十六进制颜色
     */
    setBackground(color: THREE.ColorRepresentation) {
        this.scene.background = new THREE.Color(color);
    }

    /**
     * 添加辅助坐标
     */
    addAxis(length?: number) {
        const axes = new THREE.AxesHelper(length || 1000);
        this.scene.add(axes);
    }

    /**
     * 添加控制器
     */
    orbitControls() {
        // const controls = new OrbitControls(
        //     this.camera,
        //     this.renderer.domElement
        // );
           const controls = new OrbitControls(
            this.camera,
            this?.labelRenderer?.domElement || this.renderer.domElement,
        );
        // controls.minDistance = -100;
        this.controls = controls as unknown as OrbitControls;
        // controls.addEventListener("change", () => {
        //     this.render();
        // });
    }

    /**
     * 控制镜头缩放等级
     */
    zoom(min: number, max: number) {
        this.controls.minZoom = min;
        this.controls.maxZoom = max;
    }

    /**
     * 镜头移动距离限制
     */
    distance(min: number, max: number) {
        this.controls.minDistance = min;
        this.controls.maxDistance = max;
    }

    /**
     * 镜头垂直方向旋转角度 默认 0-180 即 angle(0,Math.PI)
     */
    angle(min: number, max: number) {
        this.controls.minPolarAngle = min;
        this.controls.maxPolarAngle = max;
    }

    /**
     * 手动指定尺寸
     */
    appointSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.labelRenderer && this.labelRenderer.setSize(width, height);
        this.render();
    }

    /**
     * 根据新的父元素尺寸 重置相关参数
     */
    protected resetLayout() {
        const [w, h] = this.computeCanvasSize();
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        // this.render();
        this.ResizeFn.forEach((fn) => fn());
    }

    /** 在窗口大小变动时处罚 */
    public addResizeListen(call: VoidFunction) {
        this.ResizeFn.push(call);
    }

    /**
     * 保证this指向
     */
    protected selfResetLayout = () => this.resetLayout.call(this);

    /**
     * 添加resize监听
     */
    listenResize() {
        window.addEventListener("resize", this.selfResetLayout);
    }

    removeResizeListen() {
        window.removeEventListener("resize", this.selfResetLayout);
    }

    /**
     * 清除scene中的物体
     */
    protected clearChildren(obj: THREE.Scene | any) {
        while (obj.children.length > 0) {
            this.clearChildren(obj.children[0]);
            obj.remove(obj.children[0]);
        }
        if (obj.geometry) obj.geometry.dispose();
        if (obj.type.includes("Light") && !obj.type.includes("Helper"))
            obj.dispose();

        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach((m: THREE.Material) => m.dispose());
            } else obj.material.dispose();
        }
    }

    /**
     * 清除画布中的元素 用于热更新后显示新画布元素
     */
    clearScene() {
        this.clearChildren(this.scene);
        // 清除背景纹理
        this.scene.environment?.dispose();
    }

    /**
     * 渲染画布
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer && this.labelRenderer.render( this.scene, this.camera );
        // WebGPU
        // this.renderer.renderAsync(this.scene, this.camera);
    }

    /**
     * 计算画布的宽高 由其其父元素决定 填充父元素
     */
    computeCanvasSize() {
        const parent = this.renderer.domElement.parentElement;
        if (!parent) throw new Error("未获取canvas父元素");
        const { offsetWidth, offsetHeight } = parent;
        return [offsetWidth, offsetHeight];
    }

    protected initRenderer(parameters: IProps, call: VoidFunction = () => {}) {
        this.renderer = new THREE.WebGLRenderer(parameters);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        // this.renderer.toneMapping = THREE.ReinhardToneMapping;
        // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // 像素比 分辨率
        // this.renderer.setPixelRatio(layout.pixelRatio);
        const windowPix = window.devicePixelRatio;
        const pixelRatio = parameters?.limitPixelRatio
            ? windowPix
            : Math.min(windowPix, 2);
        this.renderer.setPixelRatio(pixelRatio);
        this.resetLayout();
        call();
        return this.renderer;
    }

    /**
     * 将背景设置成透明
     */
    transparentBackGround() {
        //背景透明 主要是第二个参数 alpha
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    }

    /**
     * @description: 设置背景颜色透明度
     * @param {number} alpha 0-透明 1-不透明
     */
    setBackGroundAlpha(alpha: number) {
        this.renderer.setClearColor(new THREE.Color(0x000000), alpha);
    }
}
