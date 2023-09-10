import './index.scss';

interface ITextareaProps {
	value: string;
	onChange: (value: string) => void;
	onContextMenu?: (e: MouseEvent) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	expanded?: boolean;
	wysiwyg?: boolean;
}

export default (props: ITextareaProps) => {
	return (
		<textarea
			class={`textarea ${props.className || ''} ${props.expanded ? 'expanded' : ''}`}
			value={props.value}
			onInput={(e: Event) => {
				const proposedValue = (e.target as HTMLTextAreaElement).value;

				if (!props.expanded && proposedValue.includes('\n')) {
					(e.target as HTMLTextAreaElement).value = proposedValue.replace('\n', '');

					return props.onChange(proposedValue.replace('\n', ''));
				}

				props.onChange(proposedValue);
			}}
			onContextMenu={props.onContextMenu}
			placeholder={props.placeholder}
			disabled={props.disabled}
			style={{ height: props.expanded ? '100%' : '' }}
		/>
	);
};