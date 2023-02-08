import ReactDOM from 'react-dom';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import React, { useRef, useState, useEffect } from 'react';

import './carplayModal.scss';

const CarplayModal = ({ isShowing, hide, settings, changeSetting }) => {

    const keyboard = useRef();
    const [layout, setLayout] = useState('default');
    const [input, setInput] = useState('');

    const [fps, setFps] = useState(settings.fps)
    const [kiosk, setKiosk] = useState(settings.kiosk)
    const [height, setHeight] = useState(settings.height)
    const [width, setWidth] = useState(settings.width)
    const [lhd, setLhd] = useState(settings.lhd)
    const [dpi, setDpi] = useState(settings.dpi)
    const [keyboardTarget, setKeyboardTarget] = useState('Height')

    function close() {
        hide();
    }

    function save() {
        console.log('saving settings...');

        changeSetting('fps', parseInt(fps));
        changeSetting('kiosk', kiosk);
        changeSetting('height', parseInt(height));
        changeSetting('width', parseInt(width));
        changeSetting('lhd', parseInt(lhd));
        changeSetting('dpi', parseInt(dpi));
    }

    const handleShift = () => {
        const newLayoutName = layout === 'default' ? 'shift' : 'default';
        setLayout(newLayoutName);
    };

    const onKeyPress = button => {
        console.log('Button pressed', button);
        //If you want to handle the shift and caps lock buttons
        if (button === '{shift}' || button === '{lock}') handleShift();
    };

    const onChange = input => {
        setInput(input);
        console.log('Input changed', input);
    };

    const handleSubmit = (e) => {
        save();
    }

    const changeFps = (event) => {
        console.log(event.target.value)
        setFps(event.target.value);
    };

    const changeKiosk = (event) => {
        console.log(event.target.value)
        setKiosk(event.target.value);
    };

    const changeLhd = (event) => {
        console.log(event.target.value)
        setLhd(event.target.value);
    };

    const handleChangeHeight = event => {
        const min = 1;
        const max = 2160;
        const value = Math.max(min, Math.min(max, Number(event.target.value)));
        setHeight(value);
        console.log(height)
    };

    const handleChangeWidth = event => {
        const min = 1;
        const max = 3840;
        const value = Math.max(min, Math.min(max, Number(event.target.value)));
        setWidth(value);
        console.log(width)
    };

    const handleChangeDpi = event => {
        onChangeInput(event.target.value)
        const min = 80;
        const max = 800;
        const value = Math.max(min, Math.min(max, Number(event.target.value)));
        setDpi(value);
        console.log(dpi)
    };

    const onChangeInput = event => {
        const input = event.target.value;
        setInput(input);
        keyboard.current.setInput(input);
    };

    return ReactDOM.createPortal(
        <>
            {isShowing ?
                <div className={`container ${settings.colorTheme}`}>
                    <React.Fragment>
                        <div className='modal-overlay' />
                        <div className='modal-wrapper' aria-modal aria-hidden tabIndex={-1} role='dialog'>
                            <div className='modal'>
                                <div className='modal__body'>
                                    <div className='modal__form'>
                                        <div className='modal__form__inputContainer'>
                                            <form onSubmit={handleSubmit}>
                                                <div className='row'> <div className='row__title'>FPS:</div>
                                                    <div className='row__setting'>
                                                        <select className='dropdown' name='fps' defaultValue={fps} onChange={changeFps}>
                                                            <option value='30'>30</option>
                                                            <option value='60'>60</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className='row'> <div className='row__title'>Kiosk:</div>
                                                    <div className='row__setting'>
                                                        <select className='dropdown' name='kiosk' defaultValue={kiosk} onChange={changeKiosk}>
                                                            <option value={true}>Fullscreen</option>
                                                            <option value={false}>Window</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className='row'> <div className='row__title'>Driverside:</div>
                                                    <div className='row__setting'>
                                                        <select className='dropdown' name='lhd' defaultValue={lhd} onChange={changeLhd}>
                                                            <option value={1}>Left-Hand Drive</option>
                                                            <option value={0}>Right-Hand Drive</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className='row'> <div className='row__title'>Height:</div>
                                                    <div className='row__setting'>
                                                        <input
                                                            className='input'
                                                            type='number'
                                                            placeholder={height}
                                                            value={height}
                                                            onChange={handleChangeHeight}
                                                            onClick={(e) => setKeyboardTarget("Height")}
                                                        />
                                                    </div>
                                                </div>

                                                <div className='row'> <div className='row__title'>Width:</div>
                                                    <div className='row__setting'>
                                                        <input
                                                            className='input'
                                                            type='number'
                                                            placeholder={width}
                                                            value={width}
                                                            onChange={handleChangeWidth}
                                                            onClick={(e) => setKeyboardTarget("Width")}
                                                        />
                                                    </div>
                                                </div>

                                                <div className='row'> <div className='row__title'>DPI:</div>
                                                    <div className='row__setting'>
                                                        <input
                                                            className='input'
                                                            type='number'
                                                            placeholder={dpi}
                                                            value={dpi}
                                                            onChange={handleChangeDpi}
                                                            onClick={(e) => setKeyboardTarget("DPI")}
                                                        />
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className='modal__form__buttons'>
                                            <input type='submit' value='Save' className='button' onClick={save} />
                                            <input type='button' value='Close' className='button' onClick={close} />
                                        </div>                                    </div>
                                    
                                </div>
                            </div>
                            <div className='keyboard'>
                                <Keyboard
                                    keyboardRef={r => (keyboard.current = r)}
                                    layoutName={layout}
                                    onChange={onChange}
                                    onKeyPress={onKeyPress}
                                />
                            </div>
                        </div>
                    </React.Fragment>
                </div>
                : null
            }
        </>, document.getElementById('modal')
    );
};

export default CarplayModal;
