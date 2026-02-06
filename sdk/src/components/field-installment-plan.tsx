import { FieldProps } from "./field";
import { formFieldName } from "../utils";
import { useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { FunctionComponent } from "preact";
import { Dropdown, DropdownOption } from "./dropdown";
import { useChannelComponentData } from "./payment-channel";
import { amountFormat } from "../amount-format";
import { useSession } from "./session-provider";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const FieldInstallmentPlan: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;

  const session = useSession();

  const id = formFieldName(field);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const paymentOptions = useChannelComponentData()?.paymentOptions;
  const installmentPlans = paymentOptions?.options?.installment_plans;

  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const dropdownItems = useMemo(() => {
    const arr =
      paymentOptions?.options?.installment_plans?.map<DropdownOption>(
        (plan) => ({
          title: plan.description,
          subtitle: plan.interest_rate,
          value: plan.code,
        }),
      ) ?? [];
    arr.unshift({
      title: `Pay in Full — ${amountFormat(session.amount, session.currency)}`,
      value: "",
    });
    return arr;
  }, [
    paymentOptions?.options?.installment_plans,
    session.amount,
    session.currency,
  ]);

  let selectedItemIndex = dropdownItems?.findIndex((plan) => {
    return plan.value === selectedCode;
  });
  if (selectedItemIndex === -1) {
    selectedItemIndex = 0;
  }

  function handleChange(option: DropdownOption): void {
    if (hiddenFieldRef.current) {
      const newPlan = installmentPlans?.find(
        (plan) => plan.code === option.value,
      );
      if (newPlan) {
        hiddenFieldRef.current.value = JSON.stringify([
          newPlan.terms,
          newPlan.interval,
          newPlan.code,
        ]);
      } else {
        hiddenFieldRef.current.value = "";
      }
      hiddenFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
    setSelectedCode(option.value);
    onChange();
  }

  useLayoutEffect(() => {
    // if options change, and the selected code no longer exists, clear the field
    if (
      selectedCode &&
      !installmentPlans?.some((plan) => plan.code === selectedCode)
    ) {
      setSelectedCode(null);
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = "";
      }
    }
  }, [selectedCode, installmentPlans]);

  if (!installmentPlans || installmentPlans.length === 0) {
    return null;
  }

  return (
    <>
      <Dropdown
        id={id}
        placeholder={field.placeholder}
        className={`xendit-text-14`}
        onChange={handleChange}
        options={dropdownItems}
        selectedIndex={selectedItemIndex}
      />
      <input type="hidden" name={id} ref={hiddenFieldRef} />
    </>
  );
};
