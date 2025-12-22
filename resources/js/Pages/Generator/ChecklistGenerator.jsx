import React from "react";
import {
  Editor,
  Frame,
  Element,
  useNode,
  useEditor
} from "@craftjs/core";

// ================ COMPONENTS =================

const Container = ({ children }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div
      ref={ref => connect(drag(ref))}
      style={{
        padding: 20,
        background: "#f1f1f1",
        border: "1px solid #ccc",
        minHeight: 50
      }}
    >
      {children}
    </div>
  );
};

const Text = ({ text }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <p ref={ref => connect(drag(ref))}>
      {text}
    </p>
  );
};

const Checkbox = () => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <label ref={ref => connect(drag(ref))}>
      <input type="checkbox" /> Checkbox
    </label>
  );
};

// ================ TOOLBOX =================

const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div
      style={{
        width: 200,
        padding: 10,
        background: "#222",
        color: "#fff",
        height: "100vh"
      }}
    >
      <h3>TOOLS</h3>

      <div
        style={{ cursor: "grab", marginBottom: 10 }}
        ref={(ref) => connectors.create(ref, <Text text="Sample Label" />)}
      >
        ➤ Label
      </div>

      <div
        style={{ cursor: "grab", marginBottom: 10 }}
        ref={(ref) => connectors.create(ref, <Checkbox />)}
      >
        ➤ Checkbox
      </div>

      {/* FIXED — Container must NOT be canvas inside toolbox */}
      <div
        style={{ cursor: "grab", marginBottom: 10 }}
        ref={(ref) => connectors.create(ref, <Container />)}
      >
        ➤ Container
      </div>
    </div>
  );
};

// ================ MAIN PAGE =================

export default function ChecklistGenerator() {
  return (
    <div style={{ display: "flex" }}>
      <Toolbox />

      <div
        style={{
          flexGrow: 1,
          padding: 20,
          background: "#ececec",
          height: "100vh"
        }}
      >
        <Editor resolver={{ Container, Text, Checkbox }}>
          <Frame>
            {/* Only here you can use canvas */}
            <Element is={Container} canvas>
              Drag items here...
            </Element>
          </Frame>
        </Editor>
      </div>
    </div>
  );
}
