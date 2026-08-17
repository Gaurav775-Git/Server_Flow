import styled from "styled-components";

const Build_Button = ({ name = "Build", onClick }) => (
  <StyledWrapper>
    <button className="button" type="button" onClick={onClick}>
      {name}
    </button>
  </StyledWrapper>
);

const StyledWrapper = styled.div`
  .button {
    min-width: 96px;
    padding: 0.7rem 1.1rem;
    border: 1px solid #22d3ee;
    border-radius: 0.5rem;
    background: #0891b2;
    box-shadow: 0 4px 12px rgb(8 145 178 / 35%);
    color: #ffffff;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
    transition: background-color 150ms ease, border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .button:hover {
    background: #0e7490;
    border-color: #67e8f9;
    box-shadow: 0 6px 16px rgb(8 145 178 / 45%);
  }

  .button:focus-visible {
    outline: 3px solid rgb(103 232 249 / 55%);
    outline-offset: 3px;
  }

  .button:active {
    background: #155e75;
  }
`;

export default Build_Button;
