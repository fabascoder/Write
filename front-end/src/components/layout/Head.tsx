import React from "react";

type HeadProps = {
  title: string;
  description: string;
};

export const Head = ({ title, description }: HeadProps) => {
  React.useEffect(() => {
    document.title = `Write | ${title}`;

    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [title, description]);

  return null;
};