"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-15 17:30:45
 * @LastEditors: hongbin
 * @LastEditTime: 2025-10-17 13:55:07
 * @Description: three
 */
import { FC, useCallback, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { ThreeHelper } from "@/src/ThreeHelper";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three";

export class MainScreen {
    constructor(helper: ThreeHelper,...args:any[]) {}
    readonly destroyEvent: VoidFunction[] = [];
    /** 添加销毁监听 */
    destroy(fn: VoidFunction): void {
        this.destroyEvent.push(fn);
    }
    _destroy() {
        this.destroyEvent.forEach((fn) => fn());
    }
}

interface IProps {
    main: typeof MainScreen;
    style?: ReturnType<typeof css>;
}

const Canvas: FC<IProps> = ({ main, style }) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (ref.current) {
            const cleanup: VoidFunction[] = [];

            const helper = new ThreeHelper({
                antialias: true,
                canvas: ref.current,
            });

            const mainScene = new main(helper);

            helper.listenResize();

            cleanup.push(() => {
                mainScene._destroy();
                helper.clearScene();
                helper.stopFrame();
                helper.removeResizeListen();
                helper.removeKeyBoardListen();
            });

            return () => {
                cleanup.forEach((f) => f());
            };
        }
    }, [main]);

    return (
        <Container css={style}>
            <CanvasWrap>
                <canvas ref={ref}></canvas>
            </CanvasWrap>
        </Container>
    );
};

export default Canvas;

const CanvasWrap = styled.div`
    width: 100%;
    height: 100%;
`;

const Container = styled.div<{ css?: ReturnType<typeof css> }>`
    height: 80vh;
    width: 80vw;
    margin: 0vh auto;
    border: 2px solid #fff;
    box-shadow: 4px 1px 20px 0px #4d4b4b, -4px -1px 20px 0px #4d4b4b;
    border-radius: 4px;
    ${(props) => props.css};
`;
