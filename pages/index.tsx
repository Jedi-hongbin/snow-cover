import styled, { css } from "styled-components";
import { Main } from "../src/class/Main";
import Canvas from "@/src/components/Three/Canvas";
import { NextSEO } from "@/src/components/NextSEO";

interface IProps {}

const Index: React.FC<IProps> = () => {
    return (
        <Container>
            <NextSEO title="Jet" />
            <Header></Header>
            <Canvas
                main={Main}
                style={css`
                    border: none;
                    box-shadow: none;
                    width: 100vw;
                    /* height:100vh; */
                    height: 100vh;
                `}
            />
        </Container>
    );
};

export default Index;

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    background-color: white;
`;

const Header = styled.div`
    /* width: 100vw;
    height: 400px;
    background-color: #faa; */
`;

const Desc = styled.div`
    color: #fff;
`;
