import { FieldProps } from "./field";
import {
  assert,
  formFieldName,
  formHasFieldOfType,
  usePrevious,
} from "../utils";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FunctionComponent } from "preact";
import { Dropdown, DropdownOption, DropdownSkeleton } from "./dropdown";
import { useChannel, useChannelComponentData } from "./payment-channel";
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

  const channel = useChannel();
  assert(channel);
  const hasCardsField = useMemo(() => {
    return formHasFieldOfType(channel.form, "credit_card_number");
  }, [channel.form]);

  const paymentOptions = useChannelComponentData()?.paymentOptions;
  const installmentPlans = paymentOptions?.options?.installment_plans;

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const dropdownItems = useMemo(() => {
    const arr =
      installmentPlans?.map<DropdownOption>((plan) => ({
        title: t(`installment_plan.pay_in_installments`, {
          installments: plan.terms,
          amount: amountFormat(plan.installment_amount, session.currency),
        }),
        subtitle: plan.interest_rate,
        value: planKey(plan),
      })) ?? [];

    if (hasCardsField) {
      // the option to pay in full is shown if there is a card number field, because card payments need a way to opt out of installments.
      arr.unshift({
        title: t(`installment_plan.pay_in_full`, {
          amount: amountFormat(session.amount, session.currency),
        }),
        value: "",
      });
    }

    return arr;
  }, [hasCardsField, installmentPlans, session.amount, session.currency, t]);

  let selectedItemIndex = dropdownItems?.findIndex((item) => {
    return item.value === selectedItemKey;
  });
  if (selectedItemIndex === -1) {
    selectedItemIndex = 0;
  }

  const clearSelectedItem = useCallback(() => {
    setSelectedItemKey(null);
    if (hiddenFieldRef.current) {
      hiddenFieldRef.current.value = "";
    }
  }, []);

  const handleChange = useCallback(
    (option: DropdownOption) => {
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
        hiddenFieldRef.current?.dispatchEvent(
          new InternalSetFieldTouchedEvent(),
        );
      }
      setSelectedItemKey(option.value);
      onChange();
    },
    [installmentPlans, onChange],
  );

  useLayoutEffect(() => {
    // first render only, force select first option
    if (dropdownItems.length) handleChange(dropdownItems[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevItems = usePrevious(dropdownItems);
  useLayoutEffect(() => {
    // if options change, and the selected code no longer exists, clear the field
    if (
      dropdownItems !== prevItems &&
      !installmentPlans?.some((plan) => planKey(plan) === selectedItemKey)
    ) {
      if (dropdownItems.length) {
        handleChange(dropdownItems[0]);
      } else {
        clearSelectedItem();
      }
    }
  }, [
    clearSelectedItem,
    dropdownItems,
    handleChange,
    installmentPlans,
    prevItems,
    selectedItemKey,
  ]);

  return (
    <>
      {paymentOptions ? (
        <Dropdown
          id={id}
          placeholder={field.placeholder}
          className={`xendit-text-14`}
          onChange={handleChange}
          options={dropdownItems}
          selectedIndex={selectedItemIndex}
        />
      ) : (
        <DropdownSkeleton />
      )}
      <input type="hidden" name={id} ref={hiddenFieldRef} />
    </>
  );
};

function planKey(plan: BffInstallmentPlan) {
  return `${plan.terms}_${plan.interval}_${plan.code ?? ""}`;
}
