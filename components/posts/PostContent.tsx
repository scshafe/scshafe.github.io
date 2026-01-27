interface PostContentProps {
  htmlContent: string;
}

export default function PostContent({ htmlContent }: PostContentProps) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
