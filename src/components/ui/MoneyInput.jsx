import Input from './Input';
import { maskMoney } from '../../utils/format';

export default function MoneyInput({ value, onChange, ...rest }) {
    return (
        <Input {...rest} inputMode="numeric" placeholder="0,00"
            value={maskMoney(value)} onChange={(e) => onChange(maskMoney(e.target.value))} />
    );
}
