import { createConfetti } from '@neoconfetti/solid';
import { useFocusTrap } from '@solidjs-use/integrations/useFocusTrap';
import { JSX, Show, createEffect, createRoot, createSignal } from 'solid-js';
import { Transition } from 'solid-transition-group';

import { LocaleKey, t } from '@modules/i18n';
import { createStoreListener } from '@stores/index';
import LayerStore from '@stores/layer';
import ModalStore from '@stores/modal';
import * as ipc from '~/common/ipc';

import Button from '@ui/Common/Button';
import Icon from '@ui/Common/Icon';
import Layer from '@ui/Layer';

import './index.scss';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const { confetti } = createConfetti(); // THIS VARIABLE IS USED BY THE use:confetti DIRECTIVE, DO NOT REMOVE IT

const ipcRenderer = window.Native.DANGEROUS__NODE__REQUIRE('electron:ipcRenderer');

const SHAKE: Parameters<HTMLDivElement['animate']> = [
	[
		{
			rotate: '0deg'
		},
		{
			rotate: '-5deg'
		},

		{
			rotate: '4deg'
		},
		{
			rotate: '-3deg'
		},
		{
			rotate: '2deg'
		},
		{
			rotate: '-1deg'
		},
		{
			rotate: '0.5deg'
		},
		{
			rotate: '0deg'
		}
	],
	{
		duration: 1000,
		easing: 'ease-out'
	}
];

interface ModalProps {
	dismissable?: boolean;
	children: (props: { close: () => void }) => JSX.Element | JSX.Element[];
	size: 'small' | 'medium' | 'large' | 'x-large';
	confetti?: boolean;
	id: string | string[];
}

const Modal = (props: ModalProps) => {
	const [ref, setRef] = createSignal<HTMLElement | null>(null);
	const [open, setOpen] = createSignal(false);

	const onDeactivate = () => {
		if (!open()) return;

		if (props.dismissable) {
			return setTimeout(() => close(false), 20);
		}

		activate();

		if (matchMedia('(prefers-reduced-motion: no-preference)'))
			(ref()?.firstChild as HTMLElement)?.animate(...SHAKE);
	};

	const { activate, deactivate } = useFocusTrap(ref, {
		onDeactivate,
		initialFocus: false
	});

	ModalStore.onModalVisible(props.id, () => {
		setOpen(true);

		setTimeout(() => {
			try {
				activate();
			} catch (e) {
				console.error(e);
				// it's not vital, so we can ignore it.
			}
		}, 100); // wait for the modal to be rendered
	});

	const close = (doDeactivate = true) => {
		ModalStore.removeModalVisible(props.id);

		try {
			if (doDeactivate)
				deactivate({
					onDeactivate: () => {
						// noop
					}
				});
		} catch (e) {
			// same as above
		}

		// for whatever reason, the animation will not play any other way.
		Layer.Transitions.Fade.exit(ref()?.firstChild as HTMLElement, () => {
			setOpen(false);

			ModalStore.popState();
		});
	};

	return (
		<div
			ref={setRef}
			onMouseDown={(e) => {
				if (e.target !== ref()) return;

				if (props.dismissable) return close();

				if (matchMedia('(prefers-reduced-motion: no-preference)'))
					(ref()?.firstChild as HTMLElement)?.animate(...SHAKE);
			}}
			classList={{
				'modal-container': true,
				visible: open()
			}}
			style={{
				'z-index': 98
			}}
		>
			<Show when={open()}>
				<dialog
					open={open()}
					classList={{
						modal: true,
						[props.size || '']: true
					}}
				>
					<Show
						when={
							props.confetti && matchMedia('(prefers-reduced-motion: no-preference)')
						}
					>
						<div
							class="modal__confetti"
							use:confetti={{
								// yay
								particleCount: 300,
								particleSize: 8,
								colors: [
									'var(--color-blue-500)',
									'var(--color-green-500)',
									'var(--color-yellow-500)',
									'var(--color-red-500)',
									'var(--color-purple-500)',
									'var(--color-pink-500)',
									'var(--color-orange-500)',
									'var(--color-cyan-500)'
								]
							}}
						></div>
					</Show>
					{<props.children close={close}></props.children>}
				</dialog>
			</Show>
		</div>
	);
};

export const ModalCloseButton = (props: { close: () => void }) => {
	return (
		<button
			aria-role="button"
			aria-label={t('modal.closeModal')}
			class="modal__close"
			onClick={props.close}
		>
			<Icon size={24} variant={24} name="x-circle" />
		</button>
	);
};

export const ModalHeader = (props: {
	title?: JSX.Element;
	children: JSX.Element | JSX.Element[];
}) => {
	return (
		<div class="modal__header">
			{props.title && <h2 class="modal__header__title">{props.title}</h2>}
			{props.children}
		</div>
	);
};

export const ModalBody = (props: { children: JSX.Element | JSX.Element[] }) => {
	return <div class="modal__body">{props.children}</div>;
};

export const ModalFooter = (props: { children: JSX.Element | JSX.Element[] }) => {
	return <div class="modal__footer">{props.children}</div>;
};

export default Modal;

Modal.Layer = () => {
	const modalState = createStoreListener([ModalStore], () => ModalStore.state);
	const active = createStoreListener([ModalStore], () => ModalStore.state?.active);

	createEffect(() => {
		if (modalState()?.active) {
			LayerStore.setVisible('modal', true);
		} else {
			LayerStore.setVisible('modal', false);
		}
	});

	return (
		<Layer key="modal" transitions={Layer.Transitions.None} type="bare">
			<Transition onEnter={Layer.Transitions.Fade.enter} onExit={Layer.Transitions.Fade.exit}>
				<Show when={active()}>{modalState()?.active?.component}</Show>
			</Transition>
		</Layer>
	);
};

export const showErrorModal = (error: Error | string | unknown, message: LocaleKey) => {
	ModalStore.pushState(
		'error',
		createRoot(() => (
			<Modal size="small" dismissable id={'error'}>
				{(props) => {
					return (
						<>
							<ModalHeader title={t(message)}>
								<ModalCloseButton close={props.close} />
							</ModalHeader>
							<ModalBody>
								<p class="error-modal__message">
									{(error as Error)['message'] || (error as string)}
								</p>
								<Show when={(error as Error)['stack']}>
									<pre class="error-modal__stack">
										{(error as Error)['stack']}
									</pre>
								</Show>
							</ModalBody>
							<ModalFooter>
								<div class="modal__footer__buttons">
									<Button
										type="default"
										label={t('modal.closeModal')}
										onClick={props.close}
									>
										{t('modal.close')}
									</Button>
									<Button
										type="danger"
										label={t('modal.error.reloadClient')}
										onClick={() => {
											ipcRenderer.invoke(ipc.RELOAD_CLIENT);
										}}
									>
										{t('modal.error.reload')}
									</Button>
								</div>
							</ModalFooter>
						</>
					);
				}}
			</Modal>
		))
	);
};

window._showErrorModal = showErrorModal;
