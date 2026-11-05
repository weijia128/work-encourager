import type { FormState, UpdateForm } from "./form";

export function WishlistSection({
  form,
  update,
  errors,
}: {
  form: FormState;
  update: UpdateForm;
  errors: Record<string, string>;
}) {
  const updateWish = (index: number, patch: Partial<FormState["wishlist"][number]>) =>
    update(
      "wishlist",
      form.wishlist.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  return (
    <fieldset>
      <legend>心愿单</legend>
      {form.wishlist.map((item, index) => (
        <div className="wish-row" key={index}>
          <label>
            名称
            <input
              aria-label={`心愿名称${index + 1}`}
              value={item.name}
              onChange={(event) => updateWish(index, { name: event.target.value })}
            />
            {errors[`wishlist.${index}.name`] && (
              <span className="field-error">{errors[`wishlist.${index}.name`]}</span>
            )}
          </label>
          <label>
            价格
            <input
              aria-label={`心愿价格${index + 1}`}
              type="number"
              value={item.price || ""}
              onChange={(event) => updateWish(index, { price: Number(event.target.value) })}
            />
            {errors[`wishlist.${index}.price`] && (
              <span className="field-error">{errors[`wishlist.${index}.price`]}</span>
            )}
          </label>
          <button
            type="button"
            onClick={() =>
              update(
                "wishlist",
                form.wishlist.filter((_, itemIndex) => itemIndex !== index),
              )
            }
          >
            删除
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => update("wishlist", [...form.wishlist, { name: "", price: 0 }])}
      >
        添加心愿
      </button>
    </fieldset>
  );
}
