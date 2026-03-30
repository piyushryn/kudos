"use client";

import { deleteCategoryAction } from "./actions";

type Props = {
  categoryId: string;
};

export function DeleteCategoryButton({ categoryId }: Props) {
  return (
    <form
      className="tableActionForm"
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!confirm("Delete this category? It must have no users assigned.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <button type="submit" className="button dangerButton">
        Delete
      </button>
    </form>
  );
}
