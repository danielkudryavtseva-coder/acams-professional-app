import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "../data/mockData";
import { useNews } from "../context/NewsContext";

export interface ExecNewsPostFormProps {
  onPublished?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  /** Separate id namespaces when dialog + page could both mount */
  idPrefix?: string;
}

export function ExecNewsPostForm({
  onPublished,
  onCancel,
  cancelLabel = "Cancel",
  idPrefix = "exec-news",
}: ExecNewsPostFormProps) {
  const { addPost } = useNews();
  const [postTitle, setPostTitle] = React.useState("");
  const [postBody, setPostBody] = React.useState("");
  const [postCategory, setPostCategory] = React.useState<NewsCategory>("announcement");
  const [postExcerpt, setPostExcerpt] = React.useState("");

  const reset = React.useCallback(() => {
    setPostTitle("");
    setPostBody("");
    setPostCategory("announcement");
    setPostExcerpt("");
  }, []);

  return (
    <form
      className="w-full min-w-0 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const created = addPost({
          title: postTitle,
          body: postBody,
          category: postCategory,
          excerpt: postExcerpt.trim() || undefined,
        });
        if (created) {
          toast.success("Post published");
          reset();
          onPublished?.();
        } else {
          toast.error("Add a title and body, or sign in as an executive.");
        }
      }}
    >
      <div className="min-w-0">
        <Label htmlFor={`${idPrefix}-title`} className="text-xs">
          Title
        </Label>
        <Input
          id={`${idPrefix}-title`}
          className="mt-1 w-full"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          placeholder="Headline"
          autoComplete="off"
        />
      </div>
      <div className="min-w-0">
        <Label htmlFor={`${idPrefix}-category`} className="text-xs">
          Category
        </Label>
        <select
          id={`${idPrefix}-category`}
          className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          value={postCategory}
          onChange={(e) => setPostCategory(e.target.value as NewsCategory)}
        >
          {(Object.keys(NEWS_CATEGORY_LABELS) as NewsCategory[]).map((c) => (
            <option key={c} value={c}>
              {NEWS_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <Label htmlFor={`${idPrefix}-excerpt`} className="text-xs">
          Excerpt (optional)
        </Label>
        <Textarea
          id={`${idPrefix}-excerpt`}
          className="mt-1 min-h-[80px] w-full"
          value={postExcerpt}
          onChange={(e) => setPostExcerpt(e.target.value)}
          placeholder="Short preview; leave blank to use the start of the body."
        />
      </div>
      <div className="min-w-0">
        <Label htmlFor={`${idPrefix}-body`} className="text-xs">
          Body
        </Label>
        <Textarea
          id={`${idPrefix}-body`}
          className="mt-1 min-h-[12rem] w-full sm:min-h-[14rem]"
          value={postBody}
          onChange={(e) => setPostBody(e.target.value)}
          placeholder="Full announcement or update"
          required
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onCancel();
            }}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" className="bg-crimson text-white hover:bg-crimson/90">
          Publish
        </Button>
      </div>
    </form>
  );
}
