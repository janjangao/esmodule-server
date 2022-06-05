import React from "https://esm.sh/react@18.1.0";

type Props = {
  text: string;
};

export default function ({ text }: Props) {
  return <div>{text}</div>;
}
