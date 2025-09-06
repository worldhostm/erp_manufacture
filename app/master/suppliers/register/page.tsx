'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building, User, Phone, Mail, MapPin, Hash, FileText, Search } from 'lucide-react';

interface SupplierFormData {
  name: string;
  businessNumber: string;
  ceo: string;
  address: string;
  detailAddress: string;
  zipCode: string;
  phone: string;
  email: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  notes: string;
}

declare global {
  interface Window {
    daum: any;
  }
}

export default function RegisterSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Daum 우편번호 서비스 스크립트 로드
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 스크립트가 로드되어 있는지 확인
        if (window.daum && window.daum.Postcode) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Daum Postcode script'));
        document.head.appendChild(script);
      });
    };

    loadScript().catch(error => {
      console.error('주소 검색 서비스 로드 실패:', error);
    });
  }, []);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    businessNumber: '',
    ceo: '',
    address: '',
    detailAddress: '',
    zipCode: '',
    phone: '',
    email: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    },
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankAccount.')) {
      const bankField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [bankField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setFormData(prev => ({ ...prev, businessNumber: formatted }));
  };

  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        let fullAddress = '';
        let extraAddress = '';

        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 도로명 주소
          fullAddress = data.roadAddress;
        } else { // 지번 주소
          fullAddress = data.jibunAddress;
        }

        // 법정동명이 있을 경우 추가
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
          extraAddress += data.bname;
        }
        // 건물명이 있고, 공동주택일 경우 추가
        if (data.buildingName !== '' && data.apartment === 'Y') {
          extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
        if (extraAddress !== '') {
          extraAddress = ' (' + extraAddress + ')';
        }

        // 우편번호와 주소 정보를 해당 필드에 넣는다.
        setFormData(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: fullAddress + extraAddress
        }));

        // 상세주소 입력 필드로 포커스 이동
        const detailAddressInput = document.getElementById('detailAddress');
        if (detailAddressInput) {
          (detailAddressInput as HTMLInputElement).focus();
        }
      }
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 주소 정보 합치기
      const fullAddress = formData.detailAddress 
        ? `${formData.address} ${formData.detailAddress}`
        : formData.address;

      const submitData = {
        ...formData,
        address: fullAddress
      };

      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '협력회사 등록에 실패했습니다.');
      }

      alert('협력회사가 성공적으로 등록되었습니다.');
      router.push('/master/suppliers');
    } catch (error) {
      console.error('Error registering supplier:', error);
      alert(error instanceof Error ? error.message : '협력회사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/master/suppliers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          협력회사 목록으로
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">협력회사 등록</h1>
        <p className="mt-1 text-sm text-gray-500">새로운 협력회사 정보를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  협력회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="협력회사명을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  id="businessNumber"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleBusinessNumberChange}
                  maxLength={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="000-00-00000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ceo" className="block text-sm font-medium text-gray-700 mb-1">
                  대표자명
                </label>
                <input
                  type="text"
                  id="ceo"
                  name="ceo"
                  value={formData.ceo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="대표자명을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  대표전화
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="02-0000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="company@example.com"
                />
              </div>
              <div></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    readOnly
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="기본주소 (주소 검색 버튼을 클릭하세요)"
                />
                <input
                  type="text"
                  id="detailAddress"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="상세주소를 입력하세요 (선택사항)"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">담당자 정보</h2>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="담당자명을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 전화
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이메일
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Hash className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">계좌 정보</h2>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankAccount.bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  은행명
                </label>
                <input
                  type="text"
                  id="bankAccount.bankName"
                  name="bankAccount.bankName"
                  value={formData.bankAccount.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="은행명을 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="bankAccount.accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  id="bankAccount.accountNumber"
                  name="bankAccount.accountNumber"
                  value={formData.bankAccount.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="계좌번호를 입력하세요"
                />
              </div>
            </div>
            <div>
              <label htmlFor="bankAccount.accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                예금주명
              </label>
              <input
                type="text"
                id="bankAccount.accountHolder"
                name="bankAccount.accountHolder"
                value={formData.bankAccount.accountHolder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="예금주명을 입력하세요"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">추가 정보</h2>
            </div>
          </div>
          <div className="px-6 py-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="추가 정보나 특이사항을 입력하세요"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 bg-white px-6 py-4 rounded-lg shadow">
          <Link
            href="/master/suppliers"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}