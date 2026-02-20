import { FieldProps } from "./field";
import { formFieldName } from "../utils";
import { useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { FunctionComponent } from "preact";
import { Dropdown, DropdownOption } from "./dropdown";
import { useChannelComponentData } from "./payment-channel";
import { amountFormat } from "../amount-format";
import { useSdk, useSession } from "./session-provider";
import { InternalSetFieldTouchedEvent } from "../private-event-types";
import { BffInstallmentPlan } from "../backend-types/payment-options";

export const FieldInstallmentPlan: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;

  const { t } = useSdk();
  const session = useSession();

  const id = formFieldName(field);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);

  const paymentOptions = useChannelComponentData()?.paymentOptions;
  const installmentPlansUnsorted = paymentOptions?.options?.installment_plans;
  const installmentPlans = useMemo(() => {
    if (!installmentPlansUnsorted) return null;
    return [...installmentPlansUnsorted].sort((a, b) => {
      return a.terms - b.terms;
    });
  }, [installmentPlansUnsorted]);

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const dropdownItems = useMemo(() => {
    const arr =
      paymentOptions?.options?.installment_plans?.map<DropdownOption>(
        (plan) => ({
          title: t(`installment_plan.pay_in_installments`, {
            installments: plan.terms,
            amount: amountFormat(plan.installment_amount, session.currency),
          }),
          subtitle: plan.interest_rate,
          value: planKey(plan),
        }),
      ) ?? [];
    arr.unshift({
      title: t(`installment_plan.pay_in_full`, {
        amount: amountFormat(session.amount, session.currency),
      }),
      value: "",
    });
    return arr;
  }, [
    paymentOptions?.options?.installment_plans,
    session.amount,
    session.currency,
    t,
  ]);

  let selectedItemIndex = dropdownItems?.findIndex((item) => {
    return item.value === selectedItemKey;
  });
  if (selectedItemIndex === -1) {
    selectedItemIndex = 0;
  }

  function handleChange(option: DropdownOption): void {
    if (hiddenFieldRef.current) {
      const newPlan = installmentPlans?.find(
        (plan) => planKey(plan) === option.value,
      );
      if (newPlan) {
        if (newPlan.code) {
          // with plan code
          hiddenFieldRef.current.value = JSON.stringify([
            newPlan.terms,
            newPlan.interval,
            newPlan.code,
          ]);
        } else {
          // without plan code
          hiddenFieldRef.current.value = JSON.stringify([
            newPlan.terms,
            newPlan.interval,
          ]);
        }
      } else {
        hiddenFieldRef.current.value = "";
      }
      hiddenFieldRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
    setSelectedItemKey(option.value);
    onChange();
  }

  useLayoutEffect(() => {
    // if options change, and the selected code no longer exists, clear the field
    if (
      selectedItemKey &&
      !installmentPlans?.some((plan) => planKey(plan) === selectedItemKey)
    ) {
      setSelectedItemKey(null);
      if (hiddenFieldRef.current) {
        hiddenFieldRef.current.value = "";
      }
    }
  }, [installmentPlans, selectedItemKey]);

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

function planKey(plan: BffInstallmentPlan) {
  return `${plan.terms}_${plan.interval}_${plan.code ?? ""}`;
}
