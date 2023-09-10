import octicons from '@primer/octicons';
import { Show, JSX } from 'solid-js';

import Pull from './Pull';

import './index.scss';

export type IconName = keyof typeof octicons;

export const customIcons = {
	cPull: Pull
};

export default (props: {
	name: IconName | keyof typeof customIcons;
	variant?: 12 | 16 | 24 | 32;
	className?: string;
	size?: number;
	style?: JSX.HTMLAttributes<HTMLSpanElement>['style'];
}) => {
	return (
		<Show
			when={customIcons.hasOwnProperty(props.name)}
			fallback={
				<span
					style={props.style}
					class={`icon ${props.className || ''}`}
					innerHTML={
						props.variant
							? `<svg width=${props.size || props.variant} height=${
									props.size || props.variant
							  } viewBox="0 0 ${props.size || props.variant} ${
									props.size || props.variant
							  }" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${octicons[props.name].heights[props.variant].path}
                    </svg>`
							: octicons[props.name].toSVG({
									width: props.size || props.variant || 16
							  })
					}
				></span>
			}
		>
			<span
				style={props.style}
				class={`icon ${props.className || ''}`}
				innerHTML={`<svg width=${props.size} height=${props.size} viewBox="${
					customIcons[props.name].viewBox
				}" fill="none" xmlns="http://www.w3.org/2000/svg">${customIcons[props.name].paths
					.map(
						(p) => `<path ${Object.entries(p)
							.map(([k, v]) => `${k}="${v}"`)
							.join(' ')}
        } />`
					)
					.join('')}</svg>`}
			></span>
		</Show>
	);
};